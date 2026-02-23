"""
Configuratie — omgevingsvariabelen en applicatie-instellingen.

Gebruikt pydantic-settings voor type-safe configuratie met automatische
.env-bestandslading en validatie bij opstart.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_TITLE: str = "Viernulvier Archief API"
    API_VERSION: str = "0.1.0"
    DATABASE_URL: str = "postgresql://postgres:postgres@database:5432/viernulvier"
    # CORS_ORIGINS: list[str] = ["http://localhost"]


settings = Settings()
