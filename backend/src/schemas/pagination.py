from src.schemas.base_schema import StrictModel


class IdPagination(StrictModel):
    next_cursor: int | None
    has_more: bool


class JsonPagination(StrictModel):
    next_cursor: str | None
    has_more: bool
