from src.schemas.base_schema import StrictModel


class Pagination(StrictModel):
    next_cursor: int | None = None
    has_more: bool = False
