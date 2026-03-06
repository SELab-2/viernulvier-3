from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.schemas.tag import TagCreate, TagResponse
from src.services.tag import create_tag, delete_tag_by_id, get_tag_by_id, get_tags_list, update_tag
from src.services.auth.permissions import Permissions
from src.api.dependencies import RequirePermissions

router = APIRouter()

@router.get(
    "/",
    response_model=List[TagResponse],
    summary="Get all tags",
    description="Returns a list of tags."
)
async def get_tags(request: Request, db: Session=Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    return get_tags_list(db, base_url)

@router.get(
    "/{tag_id}", 
    response_model=TagResponse,
    summary="Get a tag",
    description="Get a tag and its corresponding names by id"
)
def get_tag(tag_id: int, request: Request, db: Session=Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    tag = get_tag_by_id(db, tag_id, base_url)
    return TagResponse.model_validate(tag)

@router.post(
    "/", 
    response_model=TagResponse,
    summary="Create a new tag",
)
async def post_tag(tag_in: TagCreate, request: Request, db: Session=Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_CREATE]))):
    base_url = str(request.base_url).rstrip("/")
    return create_tag(db, tag_in, base_url)

@router.patch(
    "/{tag_id}",
    response_model=TagResponse,
    summary="Update a tag"
)
async def patch_tag(tag_id: int, tag_in: TagCreate, request: Request, db: Session = Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_UPDATE]))):
    base_url = str(request.base_url).rstrip("/")
    return update_tag(db, tag_id, tag_in, base_url)

@router.delete(
    "/{tag_id}",
    summary="Delete a tag"
)
async def delete_tag(tag_id: str, db: Session=Depends(get_db), _: User = Depends(RequirePermissions([Permissions.ARCHIVE_DELETE]))):
    return delete_tag_by_id(db, tag_id)
