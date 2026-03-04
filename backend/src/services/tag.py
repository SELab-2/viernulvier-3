from typing import List, Sequence
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from fastapi import HTTPException

from src.models.tag import Tag, TagName
from src.schemas.tag import TagCreate, TagNameResponse, TagResponse

def build_tag_name_response(tag_name: TagName):
    return TagNameResponse(
        language_id=tag_name.language_id,
        name=tag_name.name
    )

def build_tag_response(tag: Tag, tag_names: List[TagName], base_url: str) -> TagResponse:
    return TagResponse(
        id=f"{base_url}/tags/{tag.id}",
        names=[build_tag_name_response(tag_name) for tag_name in tag_names],
    )

def get_tags_list(db: Session) -> Sequence[Tag]:
    stmt = select(Tag)
    return db.execute(stmt).scalars().all()
    
def get_tag_by_id(db: Session, tag_id: int, base_url: str) -> TagResponse:
    stmt = (
        select(Tag)
        .where(Tag.id == tag_id)
        .options(selectinload(Tag.names))
    )

    tag = db.execute(stmt).scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    return build_tag_response(tag, tag.names, base_url)

def create_tag(db: Session, tag_in: TagCreate, base_url: str):
    db_tag = Tag()

    db.add(db_tag)
    db.flush()
    
    db_tag_names = []
    for name in tag_in.names:
        db_tag_name = TagName(
            tag_id=db_tag.id,
            language_id=name.language_id,
            name=name.name
        )
        db_tag_names.append(db_tag_name)
        db.add(db_tag_name)

    db.commit()
    db.refresh(db_tag)

    return build_tag_response(db_tag, db_tag_names, base_url)

