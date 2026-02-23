"""
Configuratie — omgevingsvariabelen en applicatie-instellingen.

Gebruikt pydantic-settings voor type-safe configuratie met automatische
.env-bestandslading en validatie bij opstart.
"""

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_TITLE: str = "Viernulvier Archief API"
    API_VERSION: str = "0.1.0"

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_HOST: str
    DATABASE_PORT: int

    @computed_field
    def database_url(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.POSTGRES_DB}"

    # CORS_ORIGINS: list[str] = ["http://localhost"]


settings = Settings()
