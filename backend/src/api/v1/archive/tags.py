from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.tag import TagCreate, TagResponse
from src.services.tag import create_tag, get_tag_by_id, get_tags_list

router = APIRouter()

@router.get("/")
async def get_tags(db: Session=Depends(get_db)):
    tags = get_tags_list(db)
    return tags

@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(tag_id: int, request: Request, db: Session=Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    tag = get_tag_by_id(db, tag_id, base_url)
    return TagResponse.model_validate(tag)

@router.post("/", response_model=TagResponse)
async def post_tag(tag_in: TagCreate, request: Request, db: Session=Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    return create_tag(db, tag_in, base_url)

@router.delete("/{tag_id}")
async def delete_tag(tag_id: str) -> dict:
    return {}
