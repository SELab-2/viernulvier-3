from src.schemas.base_schema import StrictModel


class Pagination(StrictModel):
    next_cursor: str | int | None = None
    has_more: bool = False
    total_count: int
