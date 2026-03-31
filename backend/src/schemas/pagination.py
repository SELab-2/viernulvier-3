from pydantic import BaseModel

class Pagination(BaseModel):
    next_cursor: int | None = None
    has_more: bool = False
