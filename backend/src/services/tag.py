from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from src.models.tag import Tag, TagName
from src.schemas.tag import TagCreate, TagNameResponse, TagResponse


def build_tag_name_response(tag_name: TagName):
    return TagNameResponse.model_validate(tag_name)


def build_tag_response(
    tag: Tag, tag_names: List[TagName], base_url: str
) -> TagResponse:
    return TagResponse(
        id=f"{base_url}/tags/{tag.id}",
        names=[build_tag_name_response(tag_name) for tag_name in tag_names],
    )


def get_names_for_language(names, language: str | None):
    if language:
        for name in names:
            if name.language.language == language:
                return [name]
        return names
    else:
        return names


def get_tags_list(
    db: Session, base_url: str, language: str | None
) -> List[TagResponse]:
    tags = db.query(Tag).all()

    responses = []
    for tag in tags:
        names = get_names_for_language(tag.names, language)
        responses.append(build_tag_response(tag, names, base_url))
    return responses


def get_tag_by_id(
    db: Session, tag_id: int, base_url: str, language: str | None
) -> TagResponse:
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    return build_tag_response(
        tag, get_names_for_language(tag.names, language), base_url
    )


def create_tag(db: Session, tag_in: TagCreate, base_url: str):
    db_tag = Tag()

    db.add(db_tag)
    db.flush()

    db_tag_names = []
    for name in tag_in.names:
        db_tag_name = TagName(
            tag_id=db_tag.id, language_id=name.language_id, name=name.name
        )
        db_tag_names.append(db_tag_name)
        db.add(db_tag_name)

    db.commit()
    db.refresh(db_tag)

    return build_tag_response(db_tag, db_tag_names, base_url)


def update_tag(db: Session, tag_id, tag_in: TagCreate, base_url: str) -> TagResponse:
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Get a list of names that already exist (these will need to be adjusted instead of added)
    existing_names = {name.language_id: name for name in tag.names}
    for name in tag_in.names:
        if name.language_id in existing_names:
            existing_names[name.language_id].name = name.name
        else:
            db_tag_name = TagName(
                tag_id=tag.id,
                language_id=name.language_id,
                name=name.name,
            )
            db.add(db_tag_name)
            tag.names.append(db_tag_name)
    db.commit()
    db.refresh(tag)

    return build_tag_response(tag, tag.names, base_url)


def delete_tag_by_id(db: Session, tag_id):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    for tagname in tag.names:
        db.delete(tagname)

    db.delete(tag)
    db.commit()

    return {"status": "ok"}
