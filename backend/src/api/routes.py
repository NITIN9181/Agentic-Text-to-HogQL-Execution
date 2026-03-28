import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.agent.executor import HogQLAgent
from src.config import settings
from src.database.clickhouse_executor import ClickHouseExecutor
from src.database.data_uploader import ClickHouseUploader
from src.database.schema_inspector import SchemaInspector

logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    """Request body for the query stream endpoint."""

    query: str = Field(..., min_length=1, description="Natural language analytics question")
    max_iterations: int = Field(default=10, ge=1, le=20, description="Maximum agent iterations")


def _get_executor() -> ClickHouseExecutor:
    """Create a ClickHouseExecutor instance from settings."""
    return ClickHouseExecutor(
        host=settings.clickhouse_host,
        port=settings.clickhouse_port,
        database=settings.clickhouse_database,
    )


def _get_uploader() -> ClickHouseUploader:
    """Create a ClickHouseUploader instance from settings."""
    return ClickHouseUploader(
        host=settings.clickhouse_host,
        port=settings.clickhouse_port,
        database=settings.clickhouse_database,
    )


@router.post("/api/query/stream")
async def stream_query(request: QueryRequest) -> StreamingResponse:
    """Stream agent execution events as Server-Sent Events."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    executor = _get_executor()
    inspector = SchemaInspector(executor)
    agent = HogQLAgent(
        clickhouse_executor=executor,
        schema_inspector=inspector,
        nvidia_api_key=settings.nvidia_api_key,
        max_iterations=request.max_iterations,
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for event in agent.run(request.query):
                line = f"data: {json.dumps(event, default=str)}\n\n"
                yield line
        except Exception as e:
            logger.error(f"Stream error: {str(e)}")
            error_event = {
                "type": "error",
                "error": str(e),
                "iteration": 0,
                "recoverable": False,
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/api/schema/tables")
async def list_tables() -> dict:
    """List all available tables in the database."""
    executor = _get_executor()
    inspector = SchemaInspector(executor)
    tables = await inspector.list_tables()
    return {"tables": tables}


@router.get("/api/schema/full")
async def get_full_schema() -> dict:
    """Get complete schema (all tables and columns) for the tree browser."""
    executor = _get_executor()
    inspector = SchemaInspector(executor)
    schema = await inspector.get_full_schema()
    return {"tables": schema}


@router.get("/api/schema/tables/{table_name}")
async def get_table_schema(table_name: str) -> dict:
    """Get detailed schema for a specific table."""
    executor = _get_executor()
    inspector = SchemaInspector(executor)
    try:
        schema = await inspector.get_table_schema(table_name)
        return schema
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/data/upload")
async def upload_data(
    file: UploadFile = File(...),
    table_name: str = Form(None)
) -> dict:
    """Upload a CSV or Excel file to ClickHouse."""
    # 10MB limit (10 * 1024 * 1024 bytes)
    MAX_FILE_SIZE = 10485760
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")
        
    uploader = _get_uploader()
    result = await uploader.upload_file(content, file.filename, table_name)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.delete("/api/data/tables/{table_name}")
async def delete_table(table_name: str) -> dict:
    """Delete a custom table."""
    uploader = _get_uploader()
    uploader.drop_table(table_name)
    return {"status": "success", "message": f"Table {table_name} deleted."}


@router.get("/api/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
