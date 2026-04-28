# backend/src/services/media.py

from sqlalchemy import func
import uuid
import os
import io
from sqlalchemy.orm import Session
from minio import Minio
from minio.error import S3Error
from urllib.parse import urlparse

from src.config import settings
from src.models.media import Media
from src.schemas.media import MediaResponse, MediaListResponse
from src.schemas.pagination import Pagination
from src.api.exceptions import NotFoundError, ValidationError

MEDIA_DEFAULT_PAGE_SIZE = 20
MEDIA_MAX_PAGE_SIZE = 100


def build_media_response(media: Media, base_url: str) -> MediaResponse:
    parsed = urlparse(base_url)
    host_url = f"{parsed.scheme}://{parsed.netloc}"
    return MediaResponse(
        id_url=f"{base_url}/productions/{media.production_id}/media/{media.id}",
        production_id_url=f"{base_url}/productions/{media.production_id}" if media.production_id else None,
        blog_id_url=f"{base_url}/blogs/{media.blog_id}" if media.blog_id else None,
        url=f"{host_url}/media/{media.object_key}",
        content_type=media.content_type,
        uploaded_at=media.uploaded_at,
    )


def get_minio_client() -> Minio:
    """FastAPI dependency, kan overschreven worden in testen."""
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ROOT_USER,
        secret_key=settings.MINIO_ROOT_PASSWORD,
        secure=False,
    )


def get_media_by_id(db: Session, media_id: int, base_url: str) -> MediaResponse:
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise NotFoundError("Media", media_id)
    return build_media_response(media, base_url)


def list_media_for_production(
    db: Session,
    production_id: int,
    base_url: str,
    cursor: int | None = None,
    limit: int = MEDIA_DEFAULT_PAGE_SIZE,
) -> MediaListResponse:
    limit = min(limit, MEDIA_MAX_PAGE_SIZE)

    query = db.query(Media).filter(Media.production_id == production_id)

    if cursor is not None:
        query = query.filter(Media.id > cursor)

    items = query.order_by(Media.id.asc()).limit(limit + 1).all()

    has_more = len(items) > limit
    items = items[:limit]

    total_count = (
        db.query(func.count(Media.id))
        .filter(Media.production_id == production_id)
        .scalar()
    )

    return MediaListResponse(
        media=[build_media_response(m, base_url) for m in items],
        pagination=Pagination(
            next_cursor=items[-1].id if has_more else None,
            has_more=has_more,
            total_count=total_count,
        ),
    )


def list_media_for_blog(
    db: Session,
    blog_id: int,
    base_url: str,
    cursor: int | None = None,
    limit: int = MEDIA_DEFAULT_PAGE_SIZE,
) -> MediaListResponse:
    limit = min(limit, MEDIA_MAX_PAGE_SIZE)

    query = db.query(Media).filter(Media.blog_id == blog_id)

    if cursor is not None:
        query = query.filter(Media.id > cursor)

    items = query.order_by(Media.id.asc()).limit(limit + 1).all()

    has_more = len(items) > limit
    items = items[:limit]

    total_count = (
        db.query(func.count(Media.id))
        .filter(Media.blog_id == blog_id)
        .scalar()
    )

    return MediaListResponse(
        media=[build_media_response(m, base_url) for m in items],
        pagination=Pagination(
            next_cursor=items[-1].id if has_more else None,
            has_more=has_more,
            total_count=total_count,
        ),
    )


def upload_media(
    db: Session,
    production_id: int | None,
    blog_id: int | None,
    filename: str,
    content_type: str,
    data: bytes,
    minio_client: Minio,
    base_url: str,
) -> MediaResponse:
    if production_id is None and blog_id is None:
        raise ValidationError("Media need either a production_id or a blog_id")
    ext = os.path.splitext(filename)[1].lower()
    object_key = f"gallery-{production_id}/{uuid.uuid4()}{ext}"

    minio_client.put_object(
        settings.MINIO_BUCKET,
        object_key,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )

    media = Media(
        production_id=production_id,
        blog_id=blog_id,
        object_key=object_key,
        content_type=content_type,
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return build_media_response(media, base_url)


def delete_media(db: Session, media_id: int, minio_client: Minio) -> bool:
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        return False

    try:
        minio_client.remove_object(settings.MINIO_BUCKET, media.object_key)
    except S3Error as e:
        if e.code != "NoSuchKey":
            raise

    db.delete(media)
    db.commit()
    return True
