from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    nvidia_api_key: str = ""
    clickhouse_host: str = "clickhouse"
    clickhouse_port: int = 8123
    clickhouse_database: str = "posthog"
    max_agent_iterations: int = 10
    query_timeout_seconds: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
