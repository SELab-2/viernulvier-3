from typing import Generic, TypeVar
from src.schemas.base_schema import StrictModel

CursorT = TypeVar("CursorT")


class Pagination(StrictModel, Generic[CursorT]):
    next_cursor: CursorT | None
    has_more: bool


IdPagination = Pagination[int]
JsonPagination = Pagination[str]
