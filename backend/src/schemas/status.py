from enum import StrEnum

from src.schemas.base_schema import StrictModel


class ComponentStatus(StrEnum):
    OK = "ok"
    ERROR = "error"


class HealthResponse(StrictModel):
    status: ComponentStatus
    database: ComponentStatus
    detail: str | None = None
