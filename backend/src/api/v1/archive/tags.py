from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.tag import TagCreate, TagResponse
from src.services.tag import create_tag, delete_tag_by_id, get_tag_by_id, get_tags_list

router = APIRouter()

@router.get(
    "/",
    response_model=List[str],
    summary="Get all tags",
    description="Returns a list of tags."
)
async def get_tags(db: Session=Depends(get_db)):
    tags = get_tags_list(db)
    return tags

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
async def post_tag(tag_in: TagCreate, request: Request, db: Session=Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    return create_tag(db, tag_in, base_url)

@router.delete(
    "/{tag_id}",
    summary="Delete a tag"
)
async def delete_tag(tag_id: str, db: Session=Depends(get_db)):
    return delete_tag_by_id(db, tag_id)
