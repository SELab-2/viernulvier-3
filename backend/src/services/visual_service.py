import io
import os
import uuid
from urllib.parse import urlparse

from minio import Minio
from minio.error import S3Error
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.api.exceptions import NotFoundError
from src.config import settings
from src.models.visual import Visual
from src.schemas.pagination import IdPagination
from src.schemas.visual import VisualListResponse, VisualResponse, VisualType

VISUAL_DEFAULT_PAGE_SIZE = 20
VISUAL_MAX_PAGE_SIZE = 100


def build_visual_response(visual_obj: Visual, base_url: str) -> VisualResponse:
    parsed = urlparse(base_url)
    host_url = f"{parsed.scheme}://{parsed.netloc}"
    return VisualResponse(
        id_url=f"{base_url}/visuals/{visual_obj.id}",
        url=f"{host_url}/visuals/{visual_obj.object_key}",
        content_type=visual_obj.content_type,
        title=visual_obj.title,
        description=visual_obj.description,
        visual_type=visual_obj.visual_type,
        uploaded_at=visual_obj.uploaded_at,
    )


def get_visual_by_id(db: Session, visual_id: int, base_url: str) -> VisualResponse:
    visual_obj = db.query(Visual).filter(Visual.id == visual_id).first()
    if not visual_obj:
        raise NotFoundError("Visual", visual_id)
    return build_visual_response(visual_obj, base_url)


def list_visuals(
    db: Session,
    base_url: str,
    cursor: int | None = None,
    limit: int = VISUAL_DEFAULT_PAGE_SIZE,
    visual_type: VisualType | None = None,
) -> VisualListResponse:
    limit = min(limit, VISUAL_MAX_PAGE_SIZE)

    query = db.query(Visual)

    if visual_type is not None:
        query = query.filter(Visual.visual_type == visual_type.value)

    if cursor is not None:
        query = query.filter(Visual.id > cursor)

    items = query.order_by(Visual.id.asc()).limit(limit + 1).all()

    has_more = len(items) > limit
    items = items[:limit]

    count_query = db.query(func.count(Visual.id))
    if visual_type is not None:
        count_query = count_query.filter(Visual.visual_type == visual_type.value)
    total_count = count_query.scalar()

    return VisualListResponse(
        visuals=[build_visual_response(p, base_url) for p in items],
        pagination=IdPagination(
            next_cursor=items[-1].id if has_more else None,
            has_more=has_more,
            total_count=total_count,
        ),
    )


def upload_visual(
    db: Session,
    filename: str,
    content_type: str,
    data: bytes,
    minio_client: Minio,
    base_url: str,
    title: str | None = None,
    description: str | None = None,
    visual_type: VisualType | None = None,
) -> VisualResponse:
    ext = os.path.splitext(filename)[1].lower()
    object_key = f"{uuid.uuid4()}{ext}"

    minio_client.put_object(
        settings.MINIO_VISUALS_BUCKET,
        object_key,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )

    visual_obj = Visual(
        object_key=object_key,
        content_type=content_type,
        title=title,
        description=description,
        visual_type=visual_type.value if visual_type is not None else None,
    )
    db.add(visual_obj)
    db.commit()
    db.refresh(visual_obj)

    return build_visual_response(visual_obj, base_url)


def delete_visual(db: Session, visual_id: int, minio_client: Minio) -> bool:
    visual_obj = db.query(Visual).filter(Visual.id == visual_id).first()
    if not visual_obj:
        return False

    try:
        minio_client.remove_object(settings.MINIO_VISUALS_BUCKET, visual_obj.object_key)
    except S3Error as e:
        if e.code != "NoSuchKey":
            raise

    db.delete(visual_obj)
    db.commit()
    return True
