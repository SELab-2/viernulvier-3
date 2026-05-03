from pydantic import Field
from typing import Optional
from src.schemas.base_schema import StrictModel
from src.schemas.pagination import Pagination


# The response for content of a blog in a specific language
class BlogContentResponse(StrictModel):
    blog_id_url: str
    language: str
    title: str
    content: str


# The response for a blog
class BlogResponse(StrictModel):
    id_url: str
    blog_contents: list[BlogContentResponse] = Field(default_factory=list)
    production_id_urls: list[str] = Field(default_factory=list)


# The response for a list of blogs
class BlogListResponse(StrictModel):
    blogs: list[BlogResponse] = Field(default_factory=list)
    pagination: Pagination = Field(default_factory=Pagination)


# The model for creating content of a blog in a specific language
class BlogContentCreate(StrictModel):
    language: str
    title: str
    content: str


# The model for creating a blog
class BlogCreate(StrictModel):
    blog_content: BlogContentCreate
    production_id_urls: list[str] = []


# The model for updating content of a blog in a specific language
class BlogContentUpdate(StrictModel):
    language: str
    title: Optional[str] = None
    content: Optional[str] = None


# The model for updating a blog
class BlogUpdate(StrictModel):
    blog_contents: list[BlogContentUpdate] = []
    production_id_urls: list[str] = []
    remove_languages: list[str] | None = None
