from sqlalchemy.orm import Session
from src.models import Blog, BlogContent
from src.schemas.pagination import Pagination
from src.schemas.blogs import (
    BlogContentResponse,
    BlogResponse,
    BlogListResponse,
    # BlogContentCreate,
    # BlogContentUpdate,
    # BlogCreate
)
from src.api.exceptions import NotFoundError


def build_blog_content_response(
    blog_content: BlogContent, base_url: str
) -> BlogContentResponse:
    return BlogContentResponse(
        blog_id_url=f"{base_url}/blogs/{blog_content.blog_id}",
        language=blog_content.language,
        content=blog_content.content,
    )


def build_blog_response(
    db: Session, blog: Blog, base_url: str, language: str | None
) -> BlogResponse:
    blog_contents = None
    if language is not None:
        blog_contents = (
            db.query(BlogContent)
            .filter(BlogContent.blog_id == blog.id, BlogContent.language == language)
            .all()
        )
    if blog_contents is None:
        blog_contents = (
            db.query(BlogContent).filter(BlogContent.blog_id == blog.id).all()
        )
    blog_contents = [
        build_blog_content_response(blog_content, base_url)
        for blog_content in blog_contents
    ]
    return BlogResponse(
        id_url=f"{base_url}/blogs/{blog.id}",
        title=blog.title,
        author_id_url=f"{base_url}/users/{blog.author_id}",
        blog_contents=blog_contents,
        productions=get_productions_for_blog(db, blog.id, base_url),
    )


def get_productions_for_blog(db: Session, blog_id: int, base_url: str) -> list[str]:
    blog = db.get(Blog, blog_id)
    if not blog:
        return []

    return [
        f"{base_url}/productions/{production.id}" for production in blog.productions
    ]


def get_blogs_paginated(
    db: Session,
    base_url: str,
    language: str | None,
    cursor: str | None,
    limit: int = 20,
) -> BlogListResponse:
    query = db.query(Blog)
    if cursor is not None:
        query = query.filter(Blog.id > cursor)

    items = query.order_by(Blog.id.asc()).limit(limit + 1).all()

    has_more = len(items) > limit
    items = items[:limit]

    return BlogListResponse(
        blogs=[build_blog_response(db, blog, base_url, language) for blog in items],
        pagination=Pagination(
            next_cursor=items[-1].id if has_more else None, has_more=has_more
        ),
    )


def get_blog_by_id(
    db: Session, blog_id: int, base_url: str, language: str | None
) -> BlogResponse:
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise NotFoundError("Blog", blog_id)
    return build_blog_response(db, blog, base_url, language)
