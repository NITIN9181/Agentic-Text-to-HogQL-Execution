import datetime
import json
import logging
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator

from openai import AsyncOpenAI

from src.agent.prompts import get_system_prompt
from src.database.clickhouse_executor import ClickHouseExecutor
from src.database.schema_inspector import SchemaInspector

logger = logging.getLogger(__name__)


@dataclass
class AgentState:
    """Tracks the state of an agent execution run."""

    messages: list[dict[str, Any]] = field(default_factory=list)
    iteration: int = 0
    max_iterations: int = 10
    original_query: str = ""
    final_result: dict[str, Any] | None = None
    completed: bool = False


class HogQLAgent:
    """Autonomous agent that translates natural language to HogQL and self-corrects errors."""

    def __init__(
        self,
        clickhouse_executor: ClickHouseExecutor,
        schema_inspector: SchemaInspector,
        nvidia_api_key: str,
        max_iterations: int = 10,
    ) -> None:
        self.ch_executor = clickhouse_executor
        self.schema_inspector = schema_inspector
        self.client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=nvidia_api_key,
        )
        self.model = "openai/gpt-oss-120b"
        self.max_iterations = max_iterations
        self.logger = logging.getLogger(self.__class__.__name__)

        self.tools: list[dict[str, Any]] = [
            {
                "type": "function",
                "function": {
                    "name": "execute_hogql",
                    "description": (
                        "Executes a HogQL SELECT query against the ClickHouse analytics database. "
                        "Returns query results as rows or a detailed error message. "
                        "Always use this to validate your queries."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "A valid HogQL SELECT statement to execute",
                            },
                            "reasoning": {
                                "type": "string",
                                "description": "Brief explanation of why this query answers the user's question",
                            },
                        },
                        "required": ["query", "reasoning"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "inspect_schema",
                    "description": (
                        "Returns detailed schema information for the specified tables, "
                        "including column names, data types, and 3 sample rows. "
                        "Use this to understand table structure before writing queries."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "table_names": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of table names to inspect",
                            },
                        },
                        "required": ["table_names"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_available_tables",
                    "description": (
                        "Lists all available tables in the analytics database with their row counts. "
                        "Call this first to discover what data is available."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                },
            },
        ]

    async def run(self, user_query: str) -> AsyncGenerator[dict[str, Any], None]:
        """Main agentic loop: iteratively calls LLM with tools until a result is obtained."""
        state = AgentState(
            original_query=user_query,
            max_iterations=self.max_iterations,
        )

        system_prompt = get_system_prompt()

        state.messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    f"Answer this product analytics question by generating and executing HogQL queries:\n\n"
                    f"{user_query}\n\n"
                    f"Start by discovering available tables and inspecting their schemas."
                ),
            },
        ]

        while state.iteration < state.max_iterations and not state.completed:
            state.iteration += 1

            yield {
                "type": "iteration_start",
                "iteration": state.iteration,
                "max_iterations": state.max_iterations,
                "timestamp": datetime.datetime.utcnow().isoformat(),
            }

            try:
                # Initialize variables for streaming accumulation
                full_content = ""
                full_reasoning = ""
                tool_calls_chunks: dict[int, dict[str, Any]] = {}
                
                # Call LLM with stream=True
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=state.messages,
                    tools=self.tools,
                    tool_choice="auto",
                    max_tokens=4096,
                    temperature=0.0,
                    stream=True
                )

                async for chunk in response:
                    if not chunk.choices:
                        continue
                    
                    delta = chunk.choices[0].delta
                    
                    # 1. Handle Reasoning Content (Chain of Thought)
                    reasoning = getattr(delta, "reasoning_content", None)
                    if reasoning:
                        full_reasoning += reasoning
                        yield {
                            "type": "thought",
                            "content": reasoning,
                            "is_delta": True,
                            "timestamp": datetime.datetime.utcnow().isoformat(),
                        }
                    
                    # 2. Handle Regular Content
                    if delta.content:
                        full_content += delta.content
                        yield {
                            "type": "thought",
                            "content": delta.content,
                            "is_delta": True,
                            "timestamp": datetime.datetime.utcnow().isoformat(),
                        }

                    # 3. Handle Tool Calls
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            if tc.index not in tool_calls_chunks:
                                tool_calls_chunks[tc.index] = {
                                    "id": tc.id,
                                    "name": tc.function.name or "",
                                    "arguments": tc.function.arguments or ""
                                }
                            else:
                                if tc.id:
                                    tool_calls_chunks[tc.index]["id"] = tc.id
                                if tc.function.name:
                                    tool_calls_chunks[tc.index]["name"] += tc.function.name
                                if tc.function.arguments:
                                    tool_calls_chunks[tc.index]["arguments"] += tc.function.arguments

                # Finalize tool calls
                final_tool_calls = []
                for idx in sorted(tool_calls_chunks.keys()):
                    final_tool_calls.append(tool_calls_chunks[idx])

                # Reconstruct assistant message for history
                assistant_msg: dict[str, Any] = {
                    "role": "assistant",
                    "content": full_content,
                }
                if final_tool_calls:
                    assistant_msg["tool_calls"] = [
                        {
                            "id": tc["id"],
                            "type": "function",
                            "function": {
                                "name": tc["name"],
                                "arguments": tc["arguments"],
                            },
                        }
                        for tc in final_tool_calls
                    ]
                
                state.messages.append(assistant_msg)

                # If no tool calls, handle termination or nudge
                if not final_tool_calls:
                    if state.final_result:
                        state.completed = True
                        yield {
                            "type": "completed",
                            "message": full_content or "Query successful.",
                            "timestamp": datetime.datetime.utcnow().isoformat(),
                        }
                    else:
                        state.messages.append({
                            "role": "user",
                            "content": (
                                "You haven't executed a successful query yet. "
                                "Please use the tools to execute a HogQL query."
                            ),
                        })
                    continue

                # Execute accumulated tool calls
                for tc in final_tool_calls:
                    tool_name = tc["name"]
                    
                    try:
                        tool_args = json.loads(tc["arguments"])
                    except json.JSONDecodeError:
                        tool_args = {}

                    yield {
                        "type": "tool_call",
                        "tool": tool_name,
                        "input": tool_args,
                        "tool_call_id": tc["id"],
                        "timestamp": datetime.datetime.utcnow().isoformat(),
                    }

                    tool_result = await self._execute_tool(tool_name, tool_args)

                    yield {
                        "type": "tool_result",
                        "tool": tool_name,
                        "result": tool_result,
                        "tool_call_id": tc["id"],
                        "timestamp": datetime.datetime.utcnow().isoformat(),
                    }

                    state.messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps(tool_result, default=str),
                    })

                    if tool_name == "execute_hogql" and tool_result.get("status") == "success":
                        if tool_result.get("rows", 0) > 0:
                            state.final_result = tool_result
                            yield {
                                "type": "final_result",
                                "data": tool_result["data"],
                                "columns": tool_result["columns"],
                                "rows": tool_result["rows"],
                                "query": tool_args.get("query", ""),
                                "reasoning": tool_args.get("reasoning", ""),
                                "iterations": state.iteration,
                                "execution_time_ms": tool_result.get("execution_time_ms", 0),
                                "timestamp": datetime.datetime.utcnow().isoformat(),
                            }
                            state.completed = True
                        else:
                            yield {
                                "type": "empty_result",
                                "query": tool_args.get("query", ""),
                                "message": "No data returned. Refining query...",
                                "timestamp": datetime.datetime.utcnow().isoformat(),
                            }

            except Exception as e:
                self.logger.error(f"Iteration {state.iteration} error: {str(e)}")

                yield {
                    "type": "error",
                    "error": str(e),
                    "iteration": state.iteration,
                    "recoverable": state.iteration < state.max_iterations,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                }

                # Add error context for the agent
                state.messages.append({
                    "role": "user",
                    "content": f"A system error occurred: {str(e)}. Please try a different approach.",
                })

        if not state.completed:
            yield {
                "type": "max_iterations_reached",
                "iterations": state.max_iterations,
                "message": "Maximum iterations reached without successful result",
                "timestamp": datetime.datetime.utcnow().isoformat(),
            }

    async def _execute_tool(self, tool_name: str, tool_args: dict[str, Any]) -> dict[str, Any]:
        """Dispatch a tool call to the appropriate handler."""
        try:
            if tool_name == "execute_hogql":
                return await self._tool_execute_hogql(
                    tool_args.get("query", ""),
                    tool_args.get("reasoning", ""),
                )
            elif tool_name == "inspect_schema":
                return await self._tool_inspect_schema(
                    tool_args.get("table_names", []),
                )
            elif tool_name == "get_available_tables":
                return await self._tool_get_available_tables()
            else:
                return {"status": "error", "message": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def _tool_execute_hogql(self, query: str, reasoning: str) -> dict[str, Any]:
        """Execute a HogQL query with detailed error feedback for self-correction."""
        try:
            result = await self.ch_executor.execute(query)
            return {
                "status": "success",
                "data": result["data"],
                "columns": result["columns"],
                "rows": result["rows"],
                "execution_time_ms": result["execution_time_ms"],
            }
        except Exception as e:
            error_msg = str(e)
            suggestions: list[str] = []

            if "UNKNOWN_TABLE" in error_msg or "Unknown table" in error_msg:
                suggestions.append(
                    "Table does not exist. Use get_available_tables to see valid table names."
                )
            if (
                "UNKNOWN_IDENTIFIER" in error_msg
                or "Unknown identifier" in error_msg
                or "Missing columns" in error_msg
            ):
                suggestions.append(
                    "Column not found. Use inspect_schema to check actual column names and types."
                )
            if "SYNTAX_ERROR" in error_msg or "Syntax error" in error_msg:
                suggestions.append(
                    "SQL syntax error. Check your query for typos, missing commas, or incorrect function names."
                )
            if "TYPE_MISMATCH" in error_msg:
                suggestions.append(
                    "Type mismatch. Check column types using inspect_schema and use appropriate type casting."
                )

            return {
                "status": "error",
                "error_type": "query_execution_error",
                "message": error_msg,
                "suggestions": suggestions,
                "failed_query": query,
            }

    async def _tool_inspect_schema(self, table_names: list[str]) -> dict[str, Any]:
        """Inspect schema for one or more tables."""
        schemas: dict[str, Any] = {}
        for table_name in table_names:
            try:
                schema = await self.schema_inspector.get_table_schema(table_name)
                schemas[table_name] = schema
            except Exception as e:
                schemas[table_name] = {"error": str(e)}

        return {
            "status": "success",
            "schemas": schemas,
        }

    async def _tool_get_available_tables(self) -> dict[str, Any]:
        """List all available tables in the database."""
        try:
            tables = await self.schema_inspector.list_tables()
            return {
                "status": "success",
                "tables": tables,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
