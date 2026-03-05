from backend.src.schemas.production import Pagination
from sqlalchemy.orm import Session
from src.models import Production, ProdInfo, Language
from src.schemas import ProductionCreate, ProductionInfoCreate, ProductionResponse, ProductionInfoResponse, ProductionListResponse

# The response functions: both return copies.
def build_production_info_response(production_info: ProdInfo, base_url: str) -> ProductionInfoResponse:
    return ProductionInfoResponse(
        production_id=f"{base_url}/productions/{production_info.production_id}",
        language_id=f"{base_url}/languages/{production_info.language_id}",
        title=production_info.title,
        supertitle=production_info.supertitle,
        artist=production_info.artist,
        tagline=production_info.tagline,
        teaser=production_info.teaser,
        description=production_info.description,
        info=production_info.info
    )

def build_production_response(db: Session, production: Production, base_url: str) -> ProductionResponse:
    production_infos = db.query(ProdInfo).filter(ProdInfo.production_id == production.id).all()    
    production_infos = [build_production_info_response(db_prod_info, base_url) for db_prod_info in production_infos]

    return ProductionResponse(
        id=f"{base_url}/productions/{production.id}",
        performer_type=production.performer_type,
        attendance_mode=production.attendance_mode,
        media_gallery_id=production.media_gallery_id,
        created_at=production.created_at,
        updated_at=production.updated_at,
        info=production_infos
    )

# /GET /productions --> Use pagination to return a part of all productions.
def get_productions_service(db: Session, base_url: str, cursor: int | None = None, limit: int = 20) -> ProductionListResponse: 
    query = db.query(Production).order_by(Production.id)
    if cursor is not None:
        query = query.filter(Production.id > cursor)
    
    productions = query.limit(limit+1).all()
    has_more = len(productions) > limit
    productions = productions[:limit]
    next_cursor = productions[-1].id if productions else None
    
    return ProductionListResponse(
        productions=[
            build_production_response(db, production, base_url) 
            for production in productions
        ],
        pagination=Pagination(
            next_cursor=next_cursor,
            has_more=has_more
        )
    )   
    

# /GET /productions/{production_id}/infos/{language_id}.
# If we leave language ID as it is, we can have multiple prodinfos in the same language for one production.
def get_production_info_id_service(db: Session, production_id: int, language_id: int, base_url: str) -> ProductionInfoResponse:
    production_info = db.query(ProdInfo).filter(ProdInfo.production_id == production_id, ProdInfo.language_id == language_id).first()
    if not production_info:
        raise ValueError(f"Production info with production id '{production_id}' and language id '{language_id}' not found.")
    return build_production_info_response(production_info, base_url)

# /GET /productions/{production_id}.
# Returns a copy of the production.
def get_production_id_service(db: Session, production_id: int, base_url: str) -> ProductionResponse:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise ValueError(f"Production info with production id '{production_id}' not found.")
    return build_production_response(db, production, base_url)

# /DELETE /productions/{production_id}/infos/{language_id} --> Deletes the production info for the given language.
# Returns succes or failure.
def delete_production_info_service(db: Session, production_id: int, language_id: int) -> bool:
    production_info = db.query(ProdInfo).filter(ProdInfo.production_id == production_id, ProdInfo.language_id == language_id).first()
    if not production_info:
        return False

    db.delete(production_info)
    db.commit()
    return True

# /DELETE /productions/{production_id} --> Deletes the production and all related production infos.
# Returns succes or failure. 
def delete_production_service(db: Session, production_id: int) -> bool:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        return False

    db.query(ProdInfo).filter(ProdInfo.production_id == production_id).delete()
    db.delete(production)
    db.commit()
    return True

def get_language_id_service(db: Session, language: str) -> int:
    language = db.query(Language).filter(Language.name == language).first()
    return language.id if language else None

# /POST /productions/{production_id}/infos/{language_id} --> Creates a new production info for the given language.
# Returns a copy of the created production info if not first info, else returns the production object.
def create_production_info_service(db: Session, production_id: int, production_info_in: ProductionInfoCreate, language: str, base_url: str, first_info=False) -> ProductionInfoResponse:
    # Given language when creating new production info should exist in the database.
    language_id = get_language_id_service(db, language)
    if language_id is None:
        raise ValueError(f"Language '{language}' not found in the database.")

    db_production_info = ProdInfo(
        title=production_info_in.title,
        supertitle=production_info_in.supertitle,
        artist=production_info_in.artist,
        tagline=production_info_in.tagline,
        teaser=production_info_in.teaser,
        description=production_info_in.description,
        info=production_info_in.info,
        production_id=production_id,
        language_id=language_id
    )

    if not first_info:
        db.add(db_production_info)
        db.commit()
        db.refresh(db_production_info)
        return build_production_info_response(db_production_info, base_url)

    return db_production_info

# /POST /productions --> Creates a new production and a new production info for the given language. 
# Returns a copy of the created production.
def create_production_service(db: Session, production_in: ProductionCreate, production_info_in: ProductionInfoCreate, language: str, base_url: str) -> ProductionResponse:
    # Given language when creating new production should exist in the database.
    language_id = get_language_id_service(db, language)
    if language_id is None:
        raise ValueError(f"Language '{language}' not found")
    
    db_production = Production(
        performer_type=production_in.performer_type,
        attendance_mode=production_in.attendance_mode,
        media_gallery_id=production_in.media_gallery_id,
        created_at=production_in.created_at,
        updated_at=production_in.updated_at
    )

    db.add(db_production)
    db.flush()
    
    db_production_info = create_production_info_service(db, db_production.id, production_info_in, language, base_url, first_info=True)
    
    db.add(db_production_info)
    db.commit()
    db.refresh(db_production)
    db.refresh(db_production_info)
    return build_production_response(db, db_production, base_url=base_url)

# PATCH /productions/{production_id}/infos/{language_id} --> Updates the production info for the given language.
def update_production_info_service(db: Session, production_id: int, language_id: int, production_info_in: ProductionInfoCreate, base_url: str) -> ProductionInfoResponse:
    production_info = db.query(ProdInfo).filter(ProdInfo.production_id == production_id, ProdInfo.language_id == language_id).first()
    if not production_info:
        raise ValueError(f"Production info with production id '{production_id}' and language id '{language_id}' not found.")

    for field, value in production_info_in.dict(exclude_unset=True).items():
        setattr(production_info, field, value)

    db.commit()
    db.refresh(production_info)
    return build_production_info_response(production_info, base_url)

# Patch /productions/{production_id} --> Updates the production and all related production infos.
def update_production_service(db: Session, production_id: int, production_in: ProductionCreate, base_url: str) -> ProductionResponse:
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise ValueError(f"Production with id '{production_id}' not found.")

    for field, value in production_in.dict(exclude_unset=True).items():
        setattr(production, field, value)

    db.commit()
    db.refresh(production)
    return build_production_response(db, production, base_url)