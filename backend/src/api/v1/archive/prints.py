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
from src.schemas.print import PrintListResponse, PrintResponse
from src.services.archive import get_base_url
from src.services.auth.permissions import Permissions
from src.services.media import get_minio_client
from src.services.print_service import (
    PRINT_DEFAULT_PAGE_SIZE,
    delete_print,
    get_print_by_id,
    list_prints,
    upload_print,
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}

router = APIRouter()


@router.get(
    "/",
    response_model=PrintListResponse,
    summary="List all prints",
    description="Returns a paginated list of all prints. Optionally filter by print_type.",
)
async def get_prints(
    request: Request,
    cursor: int | None = Query(None),
    limit: int = Query(PRINT_DEFAULT_PAGE_SIZE, ge=1),
    print_type: str | None = Query(None, description="Filter by type, e.g. poster, timetable, programme"),
    db: Session = Depends(get_db),
) -> PrintListResponse:
    base_url = get_base_url(str(request.url), 2)
    return list_prints(db, base_url, cursor, limit, print_type)


@router.get(
    "/{print_id}",
    response_model=PrintResponse,
    summary="Get a print by ID",
)
async def get_print(
    print_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> PrintResponse:
    base_url = get_base_url(str(request.url), 3)
    return get_print_by_id(db, print_id, base_url)


@router.post(
    "/",
    response_model=PrintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a print",
    description="Upload a poster, timetable, programme, or other print file.",
)
async def post_print(
    request: Request,
    file: UploadFile = File(...),
    label: str | None = Query(None, description="Human-readable label, e.g. 'Affiche seizoen 2023-24'"),
    print_type: str | None = Query(None, description="Type of print: poster, timetable, programme, other"),
    db: Session = Depends(get_db),
    minio: Minio = Depends(get_minio_client),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
) -> PrintResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"File type '{file.content_type}' not accepted. "
                f"Accepted types: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
            ),
        )
    data = await file.read()
    base_url = get_base_url(str(request.url), 2)
    return upload_print(
        db=db,
        filename=file.filename or "upload",
        content_type=file.content_type,
        data=data,
        minio_client=minio,
        base_url=base_url,
        label=label,
        print_type=print_type,
    )


@router.delete(
    "/{print_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a print",
    description="Deletes a print record and removes the file from storage.",
)
async def delete_print_endpoint(
    print_id: int,
    db: Session = Depends(get_db),
    minio: Minio = Depends(get_minio_client),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
) -> None:
    deleted = delete_print(db, print_id, minio)
    if not deleted:
        raise NotFoundError("Print", print_id)