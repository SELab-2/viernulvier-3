from sqlalchemy.orm import Session
from src.models import Blog, BlogContent
from src.models.production import Production
from src.models.user import User
from src.schemas.pagination import Pagination
from src.api.dependencies.language import get_accepted_language
from src.schemas.blogs import (
    BlogContentResponse,
    BlogResponse,
    BlogListResponse,
    BlogContentCreate,
    BlogCreate,
    BlogUpdate
)
from src.api.exceptions import NotFoundError, ValidationError


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


def create_blog_content(
    blog_content_in: BlogContentCreate, blog_id: int
) -> BlogContent:
    db_blog_content = BlogContent(
        blog_id=blog_id,
        language=blog_content_in.language,
        content=blog_content_in.content
    )
    return db_blog_content


def create_blog(
    db: Session, blog_in: BlogCreate, base_url: str
) -> BlogResponse:
    blog_content_in = blog_in.blog_content
    lang = get_accepted_language(blog_content_in.language)
    if lang is None:
        raise ValidationError(
            f"Language '{blog_content_in.language}' not supported."
        )

    production_id_urls = blog_in.production_id_urls or []
    production_ids = [int(prod_url.rstrip("/").split("/")[-1]) for prod_url in production_id_urls]

    existing_productions = db.query(Production).filter(Production.id.in_(production_ids)).all()
    existing_prod_ids = {p.id for p in existing_productions}
    missing_prod_ids = set(production_ids) - existing_prod_ids
    if missing_prod_ids:
        raise ValidationError(f"Productions do not exist: {missing_prod_ids}")

    author_id_url = blog_in.author_id_url or ""
    author_id = int(author_id_url.rstrip("/").split("/")[-1])

    author = db.query(User).filter(User.id == author_id).first()
    if not author:
        raise NotFoundError("User", author_id)

    db_blog = Blog(
        author=author,
        productions=existing_productions,
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

    update_data = blog_in.model_dump(
        exclude_unset=True, exclude={"remove_languages"}
    )
    for field, value in update_data.items():
        setattr(blog, field, value)

    if blog_in.production_id_urls is not None:
        production_id_urls = blog_in.production_id_urls or []
        production_ids = [int(prod_url.rstrip("/").split("/")[-1]) for prod_url in production_id_urls]

        existing_productions = db.query(Production).filter(Production.id.in_(production_ids)).all()
        existing_prod_ids = {p.id for p in existing_productions}
        missing_prod_ids = set(production_ids) - existing_prod_ids
        if missing_prod_ids:
            raise ValidationError(f"Productions do not exist: {missing_prod_ids}")
        blog.productions = existing_productions

    if blog_in.blog_content:
        for blog_content_in in blog_in.blog_content:
            lang = get_accepted_language(blog_content_in.language)
            if lang is None:
                raise ValidationError(f"Language '{blog_content_in.language}' not supported.")

            blog_content = db.query(BlogContent).filter(BlogContent.blog_id == blog_id, BlogContent.language == lang).first()
            if not blog_content:
                blog_content = BlogContent(blog_id=blog_id, language=lang)
                db.add(blog_content)

            update_content = blog_content_in.model_dump(
                exclude_unset=True, exclude={"language"}
            )
            for field, value in update_content.items():
                setattr(blog_content, field, value)

    if blog_content_in.remove_languages:
        for lang in blog_content_in.remove_languages:
            db.query(BlogContent).filter(BlogContent.blog_id == blog_id, BlogContent.language == lang).delete()

        db.commit()
        db.refresh(blog)
        return build_blog_response(db, blog, base_url)




def delete_blog_by_id(db: Session, blog_id: int) -> bool:
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise NotFoundError("Blog", blog_id)

    db.query(BlogContent).filter(BlogContent.blog_id == blog_id).delete()
    db.delete(Blog)
    db.commit()
    return True
