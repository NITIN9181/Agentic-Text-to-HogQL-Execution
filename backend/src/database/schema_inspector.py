import logging
import re
from typing import Any

from src.database.clickhouse_executor import ClickHouseExecutor

logger = logging.getLogger(__name__)


class SchemaInspector:
    """Inspects ClickHouse database schema for table discovery and column info."""

    def __init__(self, executor: ClickHouseExecutor) -> None:
        self.executor = executor

    async def list_tables(self) -> list[dict[str, Any]]:
        """List all user-facing tables with metadata."""
        result = await self.executor.execute(
            "SELECT name, engine, total_rows, total_bytes "
            "FROM system.tables "
            "WHERE database = currentDatabase() "
            "AND name NOT LIKE '.%' "
            "ORDER BY name"
        )
        return result["data"]

    async def get_table_schema(self, table_name: str) -> dict[str, Any]:
        """Get detailed schema for a specific table including columns and sample data."""
        # Validate table name to prevent SQL injection
        if not re.match(r"^[a-zA-Z0-9_]+$", table_name):
            raise ValueError(
                f"Invalid table name: {table_name}. "
                "Only alphanumeric characters and underscores are allowed."
            )

        # Get column definitions
        columns_result = await self.executor.execute(
            f"SELECT name, type, default_expression, comment "
            f"FROM system.columns "
            f"WHERE database = currentDatabase() AND table = '{table_name}' "
            f"ORDER BY position"
        )

        # Get sample rows (best effort)
        sample_rows: list[dict[str, Any]] = []
        try:
            sample_result = await self.executor.execute(
                f"SELECT * FROM {table_name} LIMIT 3"
            )
            sample_rows = sample_result["data"]
        except Exception as e:
            logger.warning(f"Could not fetch sample rows for {table_name}: {e}")

        # Get total row count
        total_rows = 0
        try:
            count_result = await self.executor.execute(
                f"SELECT count() as total_rows FROM {table_name}"
            )
            if count_result["data"]:
                total_rows = count_result["data"][0].get("total_rows", 0)
        except Exception as e:
            logger.warning(f"Could not fetch row count for {table_name}: {e}")

        return {
            "table_name": table_name,
            "columns": columns_result["data"],
            "sample_rows": sample_rows,
            "total_rows": total_rows,
        }
