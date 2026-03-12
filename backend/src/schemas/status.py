from enum import StrEnum

from pydantic import BaseModel


class ComponentStatus(StrEnum):
    OK = "ok"
    ERROR = "error"


class HealthResponse(BaseModel):
    status: ComponentStatus
    database: ComponentStatus
    detail: str | None = None
