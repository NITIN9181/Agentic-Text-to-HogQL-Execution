import pandas as pd
import clickhouse_connect
import logging
import io
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

class ClickHouseUploader:
    """Handles schema inference and data insertion into ClickHouse."""

    def __init__(self, host: str, port: int, database: str) -> None:
        self.host = host
        self.port = port
        self.database = database
        # Create a non-readonly client for uploads
        self.client = clickhouse_connect.get_client(
            host=host,
            port=port,
            database=database,
            settings={
                "max_insert_block_size": 100000,
            }
        )

    async def upload_file(self, file_content: bytes, filename: str, table_name: Optional[str] = None) -> dict[str, Any]:
        """Infers schema and uploads a CSV or Excel file to ClickHouse."""
        try:
            # 1. Read data with Pandas for easy inference
            if filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(file_content))
            elif filename.endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                raise ValueError("Unsupported file format. Please upload CSV or Excel.")

            # 2. Clean table name
            if not table_name:
                table_name = re.sub(r"[^a-zA-Z0-9_]", "_", filename.split(".")[0]).lower()
            
            # 3. Map Pandas types to ClickHouse types
            type_map = {
                "int64": "Int64",
                "float64": "Float64",
                "bool": "UInt8",
                "datetime64[ns]": "DateTime64(3)",
                "object": "String"
            }

            columns = []
            for col, dtype in df.dtypes.items():
                ch_type = type_map.get(str(dtype), "String")
                columns.append(f"`{col}` {ch_type}")

            schema_sql = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(columns)}) ENGINE = MergeTree() ORDER BY tuple()"

            # 4. Create Table
            self.client.command(schema_sql)

            # 5. Insert Data
            rows = df.where(pd.notnull(df), None).values.tolist()
            self.client.insert(table_name, rows, column_names=df.columns.tolist())

            return {
                "status": "success",
                "table": table_name,
                "rows_inserted": len(df),
                "columns": df.columns.tolist()
            }

        except Exception as e:
            logger.error(f"Upload failed: {str(e)}")
            return {"status": "error", "message": str(e)}

    def list_custom_tables(self) -> list[str]:
        """Lists tables in the database, filtered to exclude system tables if needed."""
        result = self.client.query("SHOW TABLES")
        return [row[0] for row in result.result_rows]

    def drop_table(self, table_name: str):
        """Removes a custom table."""
        self.client.command(f"DROP TABLE IF EXISTS `{table_name}`")
