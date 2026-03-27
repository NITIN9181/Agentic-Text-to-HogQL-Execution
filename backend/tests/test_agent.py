import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.agent.executor import AgentState, HogQLAgent
from src.database.clickhouse_executor import ClickHouseExecutor


def test_agent_state_initialization() -> None:
    """Test that AgentState initializes with correct defaults."""
    state = AgentState()
    assert state.messages == []
    assert state.iteration == 0
    assert state.max_iterations == 10
    assert state.original_query == ""
    assert state.final_result is None
    assert state.completed is False


def test_agent_state_custom_values() -> None:
    """Test that AgentState accepts custom values."""
    state = AgentState(
        original_query="test query",
        max_iterations=5,
    )
    assert state.original_query == "test query"
    assert state.max_iterations == 5


@pytest.mark.asyncio
async def test_query_validation_blocks_dangerous_queries() -> None:
    """Test that INSERT/DELETE/DROP queries raise ValueError."""
    executor = ClickHouseExecutor.__new__(ClickHouseExecutor)
    executor.client = MagicMock()
    executor._thread_pool = MagicMock()

    dangerous_queries = [
        "INSERT INTO events VALUES (1, 2, 3)",
        "DELETE FROM events WHERE 1=1",
        "DROP TABLE events",
        "ALTER TABLE events ADD COLUMN x String",
        "CREATE TABLE test (id Int32) ENGINE = MergeTree()",
        "TRUNCATE TABLE events",
    ]

    for query in dangerous_queries:
        with pytest.raises(ValueError):
            executor._validate_query(query)


def test_tool_definitions_are_valid() -> None:
    """Test that all 3 tools have required OpenAI function calling fields."""
    mock_executor = MagicMock()
    mock_inspector = MagicMock()

    agent = HogQLAgent(
        clickhouse_executor=mock_executor,
        schema_inspector=mock_inspector,
        nvidia_api_key="test-key",
    )

    assert len(agent.tools) == 3

    expected_tool_names = {"execute_hogql", "inspect_schema", "get_available_tables"}
    actual_tool_names = set()

    for tool in agent.tools:
        assert "type" in tool
        assert tool["type"] == "function"
        assert "function" in tool
        func = tool["function"]
        assert "name" in func
        assert "description" in func
        assert "parameters" in func
        assert isinstance(func["parameters"], dict)
        actual_tool_names.add(func["name"])

    assert actual_tool_names == expected_tool_names
