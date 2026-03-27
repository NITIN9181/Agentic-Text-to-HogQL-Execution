import pytest
from unittest.mock import MagicMock

from src.database.clickhouse_executor import ClickHouseExecutor


def _create_executor() -> ClickHouseExecutor:
    """Create a ClickHouseExecutor with a mocked client (no real connection)."""
    executor = ClickHouseExecutor.__new__(ClickHouseExecutor)
    executor.client = MagicMock()
    executor._thread_pool = MagicMock()
    executor.host = "localhost"
    executor.port = 8123
    executor.database = "posthog"
    return executor


def test_select_validation() -> None:
    """Verify execute() raises ValueError for non-SELECT queries."""
    executor = _create_executor()

    non_select_queries = [
        "INSERT INTO events VALUES (1, 2, 3)",
        "UPDATE events SET event='test'",
        "DELETE FROM events",
        "DROP TABLE events",
        "ALTER TABLE events DROP COLUMN uuid",
        "CREATE TABLE test (id Int32) ENGINE = MergeTree()",
        "TRUNCATE TABLE events",
    ]

    for query in non_select_queries:
        with pytest.raises(ValueError, match="(?i)(forbidden|only select)"):
            executor._validate_query(query)


def test_select_is_allowed() -> None:
    """Verify that SELECT queries pass validation."""
    executor = _create_executor()

    valid_queries = [
        "SELECT * FROM events LIMIT 10",
        "SELECT count() FROM events",
        "  SELECT event, count() FROM events GROUP BY event",
        "select * from events limit 1",
    ]

    for query in valid_queries:
        # Should not raise
        executor._validate_query(query)


def test_forbidden_keywords() -> None:
    """Verify each forbidden keyword (INSERT, DELETE, DROP, ALTER, CREATE, TRUNCATE) is blocked."""
    executor = _create_executor()

    forbidden = ["INSERT", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE"]

    for keyword in forbidden:
        query = f"{keyword} FROM events"
        with pytest.raises(ValueError):
            executor._validate_query(query)


def test_empty_query_rejected() -> None:
    """Verify that an empty query is rejected."""
    executor = _create_executor()

    with pytest.raises(ValueError, match="empty"):
        executor._validate_query("")

    with pytest.raises(ValueError, match="empty"):
        executor._validate_query("   ")
