from typing import Optional

from minio import Minio
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.api.dependencies.language import get_accepted_language
from src.api.exceptions import NotFoundError, ValidationError
from src.config import settings
from src.models import Blog, BlogContent
from src.models.media import Media
from src.models.production import Production
from src.models.production_group import ProductionGroup
from src.schemas.blogs import (
    BlogContentCreate,
    BlogContentResponse,
    BlogCreate,
    BlogListResponse,
    BlogResponse,
    BlogUpdate,
)
from src.schemas.pagination import Pagination
from src.services.production import SortOrder


def build_blog_content_response(
    blog_content: BlogContent, base_url: str
) -> BlogContentResponse:
    return BlogContentResponse(
        blog_id_url=f"{base_url}/blogs/{blog_content.blog_id}",
        language=blog_content.language,
        title=blog_content.title,
        content=blog_content.content,
    )


def build_blog_response(
    db: Session, blog: Blog, base_url: str, language: str | None = None
) -> BlogResponse:
    blog_contents = []
    if language is not None:
        blog_contents = (
            db.query(BlogContent)
            .filter(BlogContent.blog_id == blog.id, BlogContent.language == language)
            .all()
        )
    # Fallback to all available translations when requested language has no content.
    if len(blog_contents) == 0:
        blog_contents = (
            db.query(BlogContent).filter(BlogContent.blog_id == blog.id).all()
        )
    blog_contents = [
        build_blog_content_response(blog_content, base_url)
        for blog_content in blog_contents
    ]

    return BlogResponse(
        id_url=f"{base_url}/blogs/{blog.id}",
        series_id_url=get_series_for_blog(db, blog.id, base_url),
        blog_contents=blog_contents,
    )


def get_series_for_blog(db: Session, blog_id: int, base_url: str) -> Optional[str]:
    blog = db.get(Blog, blog_id)
    if not blog or not blog.production_group:
        return ""

    return f"{base_url}/series/{blog.production_group.id}"


def get_blogs_paginated(
    db: Session,
    base_url: str,
    language: str | None = None,
    cursor: str | None = None,
    limit: int = 20,
    blog_name: str | None = None,
    sort_order: SortOrder = "Descending",
) -> BlogListResponse:
    is_asc = sort_order == "Ascending"
    order_func = asc if is_asc else desc

    query = db.query(Blog)

    if blog_name:
        subq = (
            db.query(BlogContent.blog_id)
            .filter(BlogContent.title.ilike(f"%{blog_name}%"))
            .distinct()
            .subquery()
        )
        query = query.filter(Blog.id.in_(select(subq)))

    total_count = query.count()

    if cursor is not None:
        if is_asc:
            query = query.filter(Blog.id > cursor)
        else:
            query = query.filter(Blog.id < cursor)

    items = query.order_by(order_func(Blog.id)).limit(limit + 1).all()

    has_more = len(items) > limit
    items = items[:limit]

    return BlogListResponse(
        blogs=[build_blog_response(db, blog, base_url, language) for blog in items],
        pagination=Pagination(
            next_cursor=items[-1].id if has_more else None,
            has_more=has_more,
            total_count=total_count,
        ),
    )


def get_blogs_by_production_id(
    db: Session,
    production_id: int,
    base_url: str,
    language: str | None = None,
) -> BlogListResponse:
    blogs = (
        db.query(Blog)
        .join(Blog.production_group)
        .join(ProductionGroup.productions)
        .filter(Production.id == production_id)
        .all()
    )
    total_count = len(blogs)
    return BlogListResponse(
        blogs=[build_blog_response(db, blog, base_url, language) for blog in blogs],
        pagination=Pagination(
            next_cursor=None,
            has_more=False,
            total_count=total_count,
        ),
    )


def get_blog_by_id(
    db: Session, blog_id: int, base_url: str, language: str | None = None
) -> BlogResponse:
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise NotFoundError("Blog", blog_id)
    return build_blog_response(db, blog, base_url, language)


def create_blog_content(
    blog_content_in: BlogContentCreate, blog_id: int
) -> BlogContent:
    db_blog_content = BlogContent(
        blog_id=blog_id,
        language=blog_content_in.language,
        title=blog_content_in.title,
        content=blog_content_in.content,
    )
    return db_blog_content


def create_blog(db: Session, blog_in: BlogCreate, base_url: str) -> BlogResponse:
    blog_content_in = blog_in.blog_content
    lang = get_accepted_language(blog_content_in.language)
    if lang is None:
        raise ValidationError(f"Language '{blog_content_in.language}' not supported.")

    series_id_url = blog_in.series_id_url

    series = None
    if series_id_url not in (None, ""):
        series_id = int(series_id_url.split("/")[-1])
        series = (
            db.query(ProductionGroup).filter(ProductionGroup.id == series_id).first()
        )
        if series is None:
            raise NotFoundError("Series", series_id)

    db_blog = Blog(
        production_group=series,
    )

    db.add(db_blog)
    db.flush()

    db_blog_content = create_blog_content(blog_content_in, db_blog.id)

    db.add(db_blog_content)
    db.commit()
    db.refresh(db_blog)
    return build_blog_response(db, db_blog, base_url, lang)


def update_blog_by_id(
    db: Session, blog_in: BlogUpdate, blog_id: int, base_url: str
) -> BlogResponse:
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise NotFoundError("Blog", blog_id)

    if blog_in.series_id_url is not None:
        # unlink the production
        if blog_in.series_id_url == "":
            blog.production_group = None
        else:
            series_id_url = blog_in.series_id_url
            series_id = int(series_id_url.split("/")[-1])

            series = (
                db.query(ProductionGroup)
                .filter(ProductionGroup.id == series_id)
                .first()
            )

            if series is None:
                raise NotFoundError("Series", series_id)
            blog.production_group = series

    if blog_in.blog_contents:
        for blog_content_in in blog_in.blog_contents:
            lang = get_accepted_language(blog_content_in.language)
            if lang is None:
                raise ValidationError(
                    f"Language '{blog_content_in.language}' not supported."
                )

            blog_content = (
                db.query(BlogContent)
                .filter(BlogContent.blog_id == blog_id, BlogContent.language == lang)
                .first()
            )
            if not blog_content:
                blog_content = BlogContent(blog_id=blog_id, language=lang)
                db.add(blog_content)

            update_content = blog_content_in.model_dump(
                exclude_unset=True, exclude={"language"}
            )
            for field, value in update_content.items():
                setattr(blog_content, field, value)

    if blog_in.remove_languages:
        for lang in blog_in.remove_languages:
            db.query(BlogContent).filter(
                BlogContent.blog_id == blog_id, BlogContent.language == lang
            ).delete()

    db.commit()
    db.refresh(blog)
    return build_blog_response(db, blog, base_url)


def delete_blog_by_id(db: Session, blog_id: int, minio_client: Minio) -> bool:
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise NotFoundError("Blog", blog_id)

    media_items = db.query(Media).filter(Media.blog_id == blog_id).all()
    for media in media_items:
        try:
            minio_client.remove_object(settings.MINIO_BUCKET, media.object_key)
        except Exception:
            pass
        db.delete(media)

    db.query(BlogContent).filter(BlogContent.blog_id == blog_id).delete()
    db.delete(blog)
    db.commit()
    return True
