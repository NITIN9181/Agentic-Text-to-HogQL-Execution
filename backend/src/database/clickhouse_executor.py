import asyncio
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import clickhouse_connect

logger = logging.getLogger(__name__)


class ClickHouseExecutor:
    """Executes read-only HogQL/SQL queries against ClickHouse."""

    FORBIDDEN_KEYWORDS: list[str] = [
        "INSERT",
        "UPDATE",
        "DELETE",
        "DROP",
        "ALTER",
        "CREATE",
        "TRUNCATE",
        "RENAME",
    ]

    def __init__(self, host: str, port: int, database: str) -> None:
        self.host = host
        self.port = port
        self.database = database
        self.client = clickhouse_connect.get_client(
            host=host,
            port=port,
            database=database,
            settings={
                "readonly": 1,
                "max_execution_time": 10,
                "max_memory_usage": 1_000_000_000,
            },
        )
        self._thread_pool = ThreadPoolExecutor(max_workers=4)

    async def execute(self, query: str) -> dict[str, Any]:
        """Execute a read-only SELECT query and return structured results."""
        self._validate_query(query)

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self._thread_pool, self._execute_sync, query
        )
        return result

    def _validate_query(self, query: str) -> None:
        """Validate that the query is a safe read-only SELECT statement."""
        stripped = query.strip()

        if not stripped:
            raise ValueError("Query cannot be empty")

        # Check if query starts with SELECT (case-insensitive)
        if not re.match(r"^\s*SELECT", stripped, re.IGNORECASE):
            raise ValueError(
                f"Only SELECT queries are allowed. Got: {stripped[:50]}..."
            )

        # Check for forbidden keywords used as statements
        upper_query = stripped.upper()
        for keyword in self.FORBIDDEN_KEYWORDS:
            # Match keyword as a standalone word (not inside a string or function name)
            pattern = rf"\b{keyword}\b"
            if re.search(pattern, upper_query):
                # Allow keywords that appear after SELECT (in subqueries etc.)
                # But block if they appear as the primary statement
                if upper_query.strip().startswith(keyword):
                    raise ValueError(
                        f"Forbidden operation: {keyword}. Only SELECT queries are allowed."
                    )
                # Also block if INSERT/UPDATE/DELETE etc appear as statement-level keywords
                if keyword in ("INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "RENAME"):
                    # Check if keyword appears outside of string literals by simple heuristic
                    # Allow it in JSONExtract function names but block actual DDL/DML
                    before_keyword = upper_query.split(keyword)[0]
                    # If the keyword is at the start of a statement (after semicolon or beginning)
                    before_stripped = before_keyword.rstrip()
                    if before_stripped == "" or before_stripped.endswith(";"):
                        raise ValueError(
                            f"Forbidden operation: {keyword}. Only SELECT queries are allowed."
                        )

    def _execute_sync(self, query: str) -> dict[str, Any]:
        """Synchronous query execution with timing."""
        start_time = time.perf_counter()

        try:
            result = self.client.query(query)
            elapsed_ms = (time.perf_counter() - start_time) * 1000

            column_names: list[str] = list(result.column_names)
            rows_data: list[dict[str, Any]] = []

            for row in result.result_rows:
                row_dict: dict[str, Any] = {}
                for col_name, value in zip(column_names, row):
                    # Convert non-serializable types to strings
                    if isinstance(value, (bytes, bytearray)):
                        row_dict[col_name] = value.decode("utf-8", errors="replace")
                    else:
                        row_dict[col_name] = value
                rows_data.append(row_dict)

            return {
                "data": rows_data,
                "rows": len(rows_data),
                "columns": column_names,
                "execution_time_ms": round(elapsed_ms, 2),
            }

        except Exception as e:
            logger.error(f"ClickHouse query error: {str(e)}")
            raise Exception(str(e)) from e
