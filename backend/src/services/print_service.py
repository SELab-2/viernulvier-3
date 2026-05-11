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
from src.models.print import Print
from src.schemas.pagination import IdPagination
from src.schemas.print import PrintListResponse, PrintResponse

PRINT_DEFAULT_PAGE_SIZE = 20
PRINT_MAX_PAGE_SIZE = 100


def build_print_response(print_obj: Print, base_url: str) -> PrintResponse:
    parsed = urlparse(base_url)
    host_url = f"{parsed.scheme}://{parsed.netloc}"
    return PrintResponse(
        id=print_obj.id,
        id_url=f"{base_url}/prints/{print_obj.id}",
        url=f"{host_url}/media/{print_obj.object_key}",
        content_type=print_obj.content_type,
        title=print_obj.title,
        description=print_obj.description,
        print_type=print_obj.print_type,
        uploaded_at=print_obj.uploaded_at,
    )


def get_print_by_id(db: Session, print_id: int, base_url: str) -> PrintResponse:
    print_obj = db.query(Print).filter(Print.id == print_id).first()
    if not print_obj:
        raise NotFoundError("Print", print_id)
    return build_print_response(print_obj, base_url)


def list_prints(
    db: Session,
    base_url: str,
    cursor: int | None = None,
    limit: int = PRINT_DEFAULT_PAGE_SIZE,
    print_type: str | None = None,
) -> PrintListResponse:
    limit = min(limit, PRINT_MAX_PAGE_SIZE)

    query = db.query(Print)

    if print_type is not None:
        query = query.filter(Print.print_type == print_type)

    if cursor is not None:
        query = query.filter(Print.id > cursor)

    items = query.order_by(Print.id.asc()).limit(limit + 1).all()

    has_more = len(items) > limit
    items = items[:limit]

    count_query = db.query(func.count(Print.id))
    if print_type is not None:
        count_query = count_query.filter(Print.print_type == print_type)
    total_count = count_query.scalar()

    return PrintListResponse(
        prints=[build_print_response(p, base_url) for p in items],
        pagination=IdPagination(
            next_cursor=items[-1].id if has_more else None,
            has_more=has_more,
            total_count=total_count,
        ),
    )


def upload_print(
    db: Session,
    filename: str,
    content_type: str,
    data: bytes,
    minio_client: Minio,
    base_url: str,
    title: str | None = None,
    description: str | None = None,
    print_type: str | None = None,
) -> PrintResponse:
    ext = os.path.splitext(filename)[1].lower()
    object_key = f"prints/{uuid.uuid4()}{ext}"

    minio_client.put_object(
        settings.MINIO_PRINTS_BUCKET,
        object_key,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )

    print_obj = Print(
        object_key=object_key,
        content_type=content_type,
        title=title,
        description=description,
        print_type=print_type,
    )
    db.add(print_obj)
    db.commit()
    db.refresh(print_obj)

    return build_print_response(print_obj, base_url)


def delete_print(db: Session, print_id: int, minio_client: Minio) -> bool:
    print_obj = db.query(Print).filter(Print.id == print_id).first()
    if not print_obj:
        return False

    try:
        minio_client.remove_object(settings.MINIO_PRINTS_BUCKET, print_obj.object_key)
    except S3Error as e:
        if e.code != "NoSuchKey":
            raise

    db.delete(print_obj)
    db.commit()
    return True
