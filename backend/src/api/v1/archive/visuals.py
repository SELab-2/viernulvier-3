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
from src.schemas.visual import VisualListResponse, VisualResponse, VisualType
from src.services.archive import get_base_url
from src.services.auth.permissions import Permissions
from src.services.media import get_minio_client
from src.services.visual_service import (
    VISUAL_DEFAULT_PAGE_SIZE,
    delete_visual,
    get_visual_by_id,
    list_visuals,
    upload_visual,
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "video/mp4",
    "video/webm",
    "video/quicktime",
}

router = APIRouter()


@router.get(
    "/types",
    response_model=list[str],
    summary="List all valid visual types",
    description="Returns the list of accepted visual_type values.",
)
async def get_visual_types() -> list[str]:
    return [t.value for t in VisualType]


@router.get(
    "/",
    response_model=VisualListResponse,
    summary="List all visuals",
    description="Returns a paginated list of all visuals. Optionally filter by visual_type.",
)
async def get_visuals(
    request: Request,
    cursor: int | None = Query(None),
    limit: int = Query(VISUAL_DEFAULT_PAGE_SIZE, ge=1),
    visual_type: VisualType | None = Query(
        None, description="Filter by type, e.g. poster, timetable, programme"
    ),
    db: Session = Depends(get_db),
) -> VisualListResponse:
    base_url = get_base_url(str(request.url), 1)
    return list_visuals(db, base_url, cursor, limit, visual_type)


@router.get(
    "/{visual_id}",
    response_model=VisualResponse,
    summary="Get a visual by ID",
)
async def get_visual(
    visual_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> VisualResponse:
    base_url = get_base_url(str(request.url), 2)
    return get_visual_by_id(db, visual_id, base_url)


@router.post(
    "/",
    response_model=VisualResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a visual",
    description="Upload a poster, timetable, programme, or other visual file.",
)
async def post_visual(
    request: Request,
    file: UploadFile = File(...),
    title: str | None = Query(None),
    description: str | None = Query(None),
    visual_type: VisualType | None = Query(
        VisualType.OTHER, description="Category of visual: poster, timetable, programme, other"
    ),
    db: Session = Depends(get_db),
    minio: Minio = Depends(get_minio_client),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
) -> VisualResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"File type '{file.content_type}' not accepted. "
                f"Accepted types: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
            ),
        )
    data = await file.read()
    base_url = get_base_url(str(request.url), 1)
    return upload_visual(
        db=db,
        filename=file.filename or "upload",
        content_type=file.content_type,
        data=data,
        minio_client=minio,
        base_url=base_url,
        title=title,
        description=description,
        visual_type=visual_type,
    )


@router.delete(
    "/{visual_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a visual",
    description="Deletes a visual record and removes the file from storage.",
)
async def delete_visual_endpoint(
    visual_id: int,
    db: Session = Depends(get_db),
    minio: Minio = Depends(get_minio_client),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
) -> None:
    deleted = delete_visual(db, visual_id, minio)
    if not deleted:
        raise NotFoundError("Visual", visual_id)
