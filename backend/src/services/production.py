from src.schemas.production import Pagination
from sqlalchemy.orm import Session
from src.models import Event, Production, ProdInfo, Language
from src.schemas.production import (
    ProductionCreate,
    ProductionInfoCreate,
    ProductionUpdate,
    ProductionResponse,
    ProductionInfoResponse,
    ProductionListResponse,
)


# The response functions: both return copies.
def build_production_info_response(
    production_info: ProdInfo, base_url: str
) -> ProductionInfoResponse:
    return ProductionInfoResponse(
        production_id_url=f"{base_url}/productions/{production_info.production_id}",
        language_id_url=f"{base_url}/languages/{production_info.language_id}",
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
    language_id: int | None = None,
) -> ProductionResponse:
    # If language is provided, only get that specific info (if it exists, otherwise error). Otherwise, get all infos.
    if language_id is not None:
        production_infos = (
            db.query(ProdInfo)
            .filter(
                ProdInfo.production_id == production.id,
                ProdInfo.language_id == language_id,
            )
            .all()
        )
        if not production_infos:
            raise ValueError(
                f"Production info with production id '{production.id}' and language id '{language_id}' not found."
            )
    else:
        production_infos = (
            db.query(ProdInfo).filter(ProdInfo.production_id == production.id).all()
        )

    # Convert to response models.
    production_infos = [
        build_production_info_response(production_info, base_url)
        for production_info in production_infos
    ]

    # Get events of this production.
    events = get_events_for_production(db, production.id, base_url)
    return ProductionResponse(
        id_url=f"{base_url}/productions/{production.id}",
        performer_type=production.performer_type,
        attendance_mode=production.attendance_mode,
        media_gallery_id=production.media_gallery_id,
        created_at=production.created_at,
        updated_at=production.updated_at,
        production_infos=production_infos,
        events=events,
    )


# Uses pagination to return a part of all productions.
def get_productions_paginated(
    db: Session, base_url: str, cursor: int | None = None, limit: int = 20
) -> ProductionListResponse:
    query = db.query(Production).order_by(Production.id)
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


# Returns a production with given id.
def get_production_by_id(
    db: Session, production_id: int, base_url: str, language: str | None = None
) -> ProductionResponse:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise ValueError(f"Production with production id '{production_id}' not found.")
    language_id = db.query(Language.id).filter(Language.language == language).scalar()
    return build_production_response(db, production, base_url, language_id)


def create_production_info(
    production_info_in: ProductionInfoCreate, production_id: int, language_id: int
) -> ProdInfo:
    db_production_info = ProdInfo(
        production_id=production_id,
        language_id=language_id,
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
    language_id = (
        db.query(Language.id)
        .filter(Language.language == production_info_in.language)
        .scalar()
    )
    if not language_id:
        raise ValueError(f"Language '{production_info_in.language}' not supported.")

    db_production = Production(
        performer_type=production_in.performer_type,
        attendance_mode=production_in.attendance_mode,
        media_gallery_id=production_in.media_gallery_id,
        created_at=production_in.created_at,
        updated_at=production_in.updated_at,
    )

    db.add(db_production)
    db.flush()

    db_production_info = create_production_info(
        production_info_in, db_production.id, language_id
    )

    db.add(db_production_info)
    db.commit()
    db.refresh(db_production)
    return build_production_response(db, db_production, base_url, language_id)


# Updates the production and all related production infos.
def update_production_by_id(
    db: Session, production_in: ProductionUpdate, production_id: int, base_url: str
) -> ProductionResponse:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise ValueError(f"Production with id '{production_id}' not found.")

    update_data = production_in.model_dump(
        exclude_unset=True, exclude={"remove_languages"}
    )
    for field, value in update_data.items():
        setattr(production, field, value)

    # Check if info is provided.
    if production_in.production_infos:
        for production_info_in in production_in.production_infos:
            language_id = (
                db.query(Language.id)
                .filter(Language.language == production_info_in.language)
                .scalar()
            )
            if language_id is None:
                raise ValueError(
                    f"Language '{production_info_in.language}' not supported."
                )
            production_info = (
                db.query(ProdInfo)
                .filter(
                    ProdInfo.production_id == production_id,
                    ProdInfo.language_id == language_id,
                )
                .first()
            )
            if not production_info:
                production_info = ProdInfo(
                    production_id=production_id, language_id=language_id
                )
                db.add(production_info)
            update_info = production_info_in.model_dump(
                exclude_unset=True, exclude={"language"}
            )
            for field, value in update_info.items():
                setattr(production_info, field, value)

    if production_in.remove_languages:
        for lang in production_in.remove_languages:
            language_id = (
                db.query(Language.id).filter(Language.language == lang).scalar()
            )
            if language_id:
                db.query(ProdInfo).filter(
                    ProdInfo.production_id == production_id,
                    ProdInfo.language_id == language_id,
                ).delete()

    db.commit()
    # Refreshes the whole production with eager loading (simplest).
    db.refresh(production)
    return build_production_response(db, production, base_url)


# Deletes the production and all related production infos/events and returns success or failure.
def delete_production_by_id(db: Session, production_id: int) -> bool:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise ValueError(f"Production with id '{production_id}' not found.")
    if not production:
        return False

    db.query(ProdInfo).filter(ProdInfo.production_id == production_id).delete()
    db.query(Event).filter(Event.production_id == production_id).delete()
    db.delete(production)
    db.commit()
    return True
