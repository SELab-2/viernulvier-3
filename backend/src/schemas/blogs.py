from pydantic import Field
from src.schemas.base_schema import StrictModel
from src.schemas.pagination import Pagination


# The response for content of a blog in a specific language
class BlogContentResponse(StrictModel):
    blog_id_url: str
    language: str
    content: str


# The response for a blog
class BlogResponse(StrictModel):
    id_url: str
    title: str
    author_id_url: str
    blog_contents: list[BlogContentResponse] = Field(default_factory=list)
    production_id_urls: list[str] = Field(default_factory=list)


# The response for a list of blogs
class BlogListResponse(StrictModel):
    blogs: list[BlogResponse] = Field(default_factory=list)
    pagination: Pagination = Field(default_factory=Pagination)


# The response for creating content of a blog in a specific language
class BlogContentCreate(StrictModel):
    language: str
    content: str


# The response for creating a blog
class BlogCreate(StrictModel):
    title: str
    author_id_url: str
    blog_content: BlogContentCreate
    production_id_urls: list[str] = []


# The response for updating content of a blog in a specific language
class BlogContentUpdate(StrictModel):
    language: str
    content: str
