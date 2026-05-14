"""
Configuration — environment variables and application settings.
Uses pydantic-settings for type-safe configuration with automatic
.env file loading and validation on startup.
"""

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_TITLE: str = "Viernulvier archive API"
    API_VERSION: str = "0.1.0"

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_HOST: str
    DATABASE_PORT: int

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    VIERNULVIER_KEY: str

    # MinIO
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_BUCKET: str = "media"
    MINIO_VISUALS_BUCKET: str = "visuals"

    @computed_field
    def database_url(self) -> str:
        return (
            "postgresql://"
            + f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            + f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}"
            + f"/{self.POSTGRES_DB}"
        )

    # CORS_ORIGINS: list[str] = ["http://localhost"]


settings = Settings()
