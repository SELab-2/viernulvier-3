from src.schemas.pagination import Pagination
from sqlalchemy.orm import Session
from src.models import Event, Production, ProdInfo, Tag
from src.services.tag import build_tag_response, get_names_for_language
from src.schemas.tag import TagResponse
from src.api.dependencies.language import get_accepted_language
from src.schemas.production import (
    ProductionCreate,
    ProductionInfoCreate,
    ProductionUpdate,
    ProductionResponse,
    ProductionInfoResponse,
    ProductionListResponse,
)
from src.api.exceptions import NotFoundError, ValidationError


# The response functions: both return copies.
def build_production_info_response(
    production_info: ProdInfo, base_url: str
) -> ProductionInfoResponse:
    return ProductionInfoResponse(
        production_id_url=f"{base_url}/productions/{production_info.production_id}",
        language=production_info.language,
        title=production_info.title,
        supertitle=production_info.supertitle,
        artist=production_info.artist,
        tagline=production_info.tagline,
        teaser=production_info.teaser,
        description=production_info.description,
        info=production_info.info,
    )


def build_production_response(
    db: Session,
    production: Production,
    base_url: str,
    language: str | None = None,
) -> ProductionResponse:
    # If language is provided, only get that specific info if it exists. Otherwise, get all infos.
    production_infos = None
    if language is not None:
        production_infos = (
            db.query(ProdInfo)
            .filter(
                ProdInfo.production_id == production.id,
                ProdInfo.language == language,
            )
            .all()
        )
    if production_infos is None:
        production_infos = (
            db.query(ProdInfo).filter(ProdInfo.production_id == production.id).all()
        )

    # Convert to response models.
    production_infos = [
        build_production_info_response(production_info, base_url)
        for production_info in production_infos
    ]

    # Get events of this production.
    # Get tags of this productoin.
    events = get_events_for_production(db, production.id, base_url)
    tags = get_tags_for_production(db, production.id, base_url)

    return ProductionResponse(
        id_url=f"{base_url}/productions/{production.id}",
        performer_type=production.performer_type,
        attendance_mode=production.attendance_mode,
        created_at=production.created_at,
        updated_at=production.updated_at,
        production_infos=production_infos,
        events=events,
        tags=tags,
    )


# Uses pagination to return a part of all productions.
# A list of tags can be given as a paramter to filter.
def get_productions_paginated(
    db: Session,
    base_url: str,
    cursor: int | None = None,
    limit: int = 20,
    tags: list[int] | None = None,
) -> ProductionListResponse:
    query = db.query(Production).order_by(Production.id)
    if tags:
        subq = (
            db.query(Production.id)
            .join(Production.tags)
            .filter(Tag.id.in_(tags))
            .distinct()
            .subquery()
        )
        query = query.filter(Production.id.in_(subq))

    if cursor is not None:
        query = query.filter(Production.id > cursor)

    productions = query.limit(limit + 1).all()
    has_more = len(productions) > limit
    productions = productions[:limit]
    next_cursor = productions[-1].id if has_more else None

    # When returning all productions, just returs infos in all languages.
    return ProductionListResponse(
        productions=[
            build_production_response(db, production, base_url)
            for production in productions
        ],
        pagination=Pagination(next_cursor=next_cursor, has_more=has_more),
    )


# Returns all event-urls for a given production.
def get_events_for_production(
    db: Session, production_id: int, base_url: str
) -> list[str]:
    events = db.query(Event).filter(Event.production_id == production_id).all()
    return [f"{base_url}/events/{event.id}" for event in events]


# Returns all tags for a given productoin.
def get_tags_for_production(
    db: Session, production_id: int, base_url: str
) -> list[TagResponse]:
    production = db.query(Production).get(production_id)
    tags = production.tags
    responses = []
    for tag in tags:
        names = get_names_for_language(tag.names, language=None)
        responses.append(build_tag_response(tag, names, base_url))
    return responses


# Returns a production with given id.
def get_production_by_id(
    db: Session, production_id: int, base_url: str, language: str | None = None
) -> ProductionResponse:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise NotFoundError("Production", production_id)
    return build_production_response(db, production, base_url, language)


def create_production_info(
    production_info_in: ProductionInfoCreate, production_id: int, language: str
) -> ProdInfo:
    db_production_info = ProdInfo(
        production_id=production_id,
        language=language,
        title=production_info_in.title,
        supertitle=production_info_in.supertitle,
        artist=production_info_in.artist,
        tagline=production_info_in.tagline,
        teaser=production_info_in.teaser,
        description=production_info_in.description,
        info=production_info_in.info,
    )
    return db_production_info


# Creates a new production with production info for the given language.
# Returns a copy of the created production.
def create_production(
    db: Session, production_in: ProductionCreate, base_url: str
) -> ProductionResponse:
    # Given language_id when creating new production should exist in the database.
    production_info_in = production_in.production_info
    lang = get_accepted_language(production_info_in.language)
    if lang is None:
        raise ValidationError(
            f"Language '{production_info_in.language}' not supported."
        )

    tag_id_urls = production_in.tag_id_urls or []
    tag_ids = [int(tag_url.rstrip("/").split("/")[-1]) for tag_url in tag_id_urls]

    existing_tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
    existing_tag_ids = {t.id for t in existing_tags}
    missing_tag_ids = set(tag_ids) - existing_tag_ids
    if missing_tag_ids:
        raise ValidationError(f"Tags do not exist: {missing_tag_ids}")

    db_production = Production(
        performer_type=production_in.performer_type,
        attendance_mode=production_in.attendance_mode,
        created_at=production_in.created_at,
        updated_at=production_in.updated_at,
        tags=existing_tags or [],
    )

    db.add(db_production)
    db.flush()

    db_production_info = create_production_info(
        production_info_in, db_production.id, lang
    )

    db.add(db_production_info)
    db.commit()
    db.refresh(db_production)
    return build_production_response(db, db_production, base_url, lang)


# Updates the production and all related production infos.
def update_production_by_id(
    db: Session, production_in: ProductionUpdate, production_id: int, base_url: str
) -> ProductionResponse:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise NotFoundError("Production", production_id)

    update_data = production_in.model_dump(
        exclude_unset=True, exclude={"remove_languages"}
    )
    for field, value in update_data.items():
        setattr(production, field, value)

    # Check for tags.
    if production_in.tag_id_urls is not None:
        tag_id_urls = production_in.tag_id_urls or []
        tag_ids = [int(id_url.rstrip("/").split("/")[-1]) for id_url in tag_id_urls]
        existing_tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        existing_tag_ids = {t.id for t in existing_tags}
        missing_tag_ids = set(tag_ids) - existing_tag_ids
        if missing_tag_ids:
            raise ValidationError(f"Tags do not exist: {missing_tag_ids}")
        production.tags = existing_tags

    # Check if info is provided.
    if production_in.production_infos:
        for production_info_in in production_in.production_infos:
            lang = get_accepted_language(production_info_in.language)
            if lang is None:
                raise ValidationError(
                    f"Language '{production_info_in.language}' not supported."
                )

            production_info = (
                db.query(ProdInfo)
                .filter(
                    ProdInfo.production_id == production_id,
                    ProdInfo.language == lang,
                )
                .first()
            )
            if not production_info:
                production_info = ProdInfo(production_id=production_id, language=lang)
                db.add(production_info)
            update_info = production_info_in.model_dump(
                exclude_unset=True, exclude={"language"}
            )
            for field, value in update_info.items():
                setattr(production_info, field, value)

    if production_in.remove_languages:
        for lang in production_in.remove_languages:
            db.query(ProdInfo).filter(
                ProdInfo.production_id == production_id,
                ProdInfo.language == lang,
            ).delete()

    db.commit()
    # Refreshes the whole production with eager loading (simplest).
    db.refresh(production)
    return build_production_response(db, production, base_url)


# Deletes the production and all related production infos/events and returns success or failure.
def delete_production_by_id(db: Session, production_id: int) -> bool:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise NotFoundError("Production", production_id)

    db.query(ProdInfo).filter(ProdInfo.production_id == production_id).delete()
    db.query(Event).filter(Event.production_id == production_id).delete()
    db.delete(production)
    db.commit()
    return True
