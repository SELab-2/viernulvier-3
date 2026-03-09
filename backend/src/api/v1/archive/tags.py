from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from src.api.dependencies.language import get_accepted_language
from src.database import get_db
from src.models.user import User
from src.schemas.tag import TagCreate, TagResponse
from src.services.tag import (
    create_tag,
    delete_tag_by_id,
    get_tag_by_id,
    get_tags_list,
    update_tag,
)
from src.services.auth.permissions import Permissions
from src.api.dependencies import RequirePermissions

router = APIRouter()


@router.get(
    "/",
    response_model=List[TagResponse],
    summary="Get all tags",
    description="Returns a list of tags.",
)
async def get_tags(
    request: Request,
    db: Session = Depends(get_db),
    language: str | None = Depends(get_accepted_language),
):
    base_url = str(request.base_url).rstrip("/")
    return get_tags_list(db, base_url, language)


@router.get(
    "/{tag_id}",
    response_model=TagResponse,
    summary="Get a tag",
    description="Get a tag and its corresponding names by id",
)
def get_tag(
    tag_id: int,
    request: Request,
    db: Session = Depends(get_db),
    language: str | None = Depends(get_accepted_language),
):
    base_url = str(request.base_url).rstrip("/")
    try:
        tag = get_tag_by_id(db, tag_id, base_url, language)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return tag


@router.post(
    "/",
    response_model=TagResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new tag",
)
async def post_tag(
    tag_in: TagCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE])),
):
    base_url = str(request.base_url).rstrip("/")
    try:
        return create_tag(db, tag_in, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{tag_id}", response_model=TagResponse, summary="Update a tag")
async def patch_tag(
    tag_id: int,
    tag_in: TagCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE])),
):
    base_url = str(request.base_url).rstrip("/")
    try:
        return update_tag(db, tag_id, tag_in, base_url)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/{tag_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a tag"
)
async def delete_tag(
    tag_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE])),
):
    success = delete_tag_by_id(db, tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
