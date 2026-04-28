from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from minio import Minio
from sqlalchemy.orm import Session

from src.api.dependencies import RequirePermissions
from src.api.exceptions import NotFoundError
from src.database import get_db
from src.models.user import User
from src.schemas.media import MediaResponse, MediaListResponse
from src.services.archive import get_base_url
from src.services.auth.permissions import Permissions
from src.services.media import (
    MEDIA_DEFAULT_PAGE_SIZE,
    delete_media,
    get_minio_client,
    list_media_for_production,
    upload_media,
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

router = APIRouter()


@router.get(
    "/{production_id}/media/",
    response_model=MediaListResponse,
    summary="Get media for production",
    description="Returns paginated media linked to a production.",
)
async def get_media_for_production(
    production_id: int,
    request: Request,
    cursor: int | None = Query(None),
    limit: int = Query(MEDIA_DEFAULT_PAGE_SIZE, ge=1),
    db: Session = Depends(get_db),
) -> MediaListResponse:
    base_url = get_base_url(str(request.url), 3)
    return list_media_for_production(db, production_id, base_url, cursor, limit)


@router.post(
    "/{production_id}/media/",
    response_model=MediaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload media for production",
    description="Upload an image or video file linked to a production.",
)
async def post_media(
    production_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    minio: Minio = Depends(get_minio_client),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
) -> MediaResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Bestandstype '{file.content_type}' niet toegestaan. "
                f"Toegestane types: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
            ),
        )
    data = await file.read()
    base_url = get_base_url(str(request.url), 3)
    return upload_media(
        db=db,
        production_id=production_id,
        blog_id=None,
        filename=file.filename or "upload",
        content_type=file.content_type,
        data=data,
        minio_client=minio,
        base_url=base_url,
    )


@router.delete(
    "/{production_id}/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete media by id",
    description="Deletes a media item and removes it from storage.",
)
async def delete_media_endpoint(
    production_id: int,
    media_id: int,
    db: Session = Depends(get_db),
    minio: Minio = Depends(get_minio_client),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
) -> None:
    deleted = delete_media(db, media_id, minio)
    if not deleted:
        raise NotFoundError("Media", media_id)
