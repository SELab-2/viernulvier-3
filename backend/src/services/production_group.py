from sqlalchemy import func
from sqlalchemy.orm import Session
from src.api.exceptions import NotFoundError, ValidationError
from src.models.production import Production
from src.models.production_group import ProductionGroup
from src.schemas.production_group import (
    ProductionGroupCreate,
    ProductionGroupResponse,
    ProductionGroupUpdate,
)


def build_production_group_response(
    production_group: ProductionGroup, base_url: str
) -> ProductionGroupResponse:
    production_ids = sorted(
        production.id for production in production_group.productions
    )
    return ProductionGroupResponse(
        id_url=f"{base_url}/series/{production_group.id}",
        title=production_group.title,
        is_public_filter=production_group.is_public_filter,
        production_id_urls=[
            f"{base_url}/productions/{production_id}"
            for production_id in production_ids
        ],
    )


def _parse_production_ids(production_id_urls: list[str]) -> list[int]:
    try:
        return [
            int(production_url.split("/")[-1]) for production_url in production_id_urls
        ]
    except (TypeError, ValueError, IndexError):
        raise ValidationError(
            "production_id_urls must end with integer production ids."
        )


def _get_existing_productions(
    db: Session, production_id_urls: list[str]
) -> list[Production]:
    production_ids = list(dict.fromkeys(_parse_production_ids(production_id_urls)))
    if not production_ids:
        return []

    productions = db.query(Production).filter(Production.id.in_(production_ids)).all()
    productions_by_id = {production.id: production for production in productions}
    missing_ids = [
        production_id
        for production_id in production_ids
        if production_id not in productions_by_id
    ]
    if missing_ids:
        raise ValidationError(f"Productions do not exist: {missing_ids}")

    return [productions_by_id[production_id] for production_id in production_ids]


def _normalize_production_group_title(title: str | None) -> str:
    normalized_title = title.strip() if isinstance(title, str) else ""
    if not normalized_title:
        raise ValidationError("A series title is required.")

    return normalized_title


def _ensure_production_group_title_is_available(
    db: Session, title: str, exclude_production_group_id: int | None = None
) -> None:
    query = db.query(ProductionGroup).filter(
        func.lower(func.trim(ProductionGroup.title)) == title.lower()
    )
    if exclude_production_group_id is not None:
        query = query.filter(ProductionGroup.id != exclude_production_group_id)

    if query.first() is not None:
        raise ValidationError("A series with this title already exists.")


def get_production_groups_list(
    db: Session, base_url: str, public_only: bool = True
) -> list[ProductionGroupResponse]:
    query = db.query(ProductionGroup)
    if public_only:
        query = query.filter(ProductionGroup.is_public_filter.is_(True))

    return [
        build_production_group_response(production_group, base_url)
        for production_group in query.order_by(ProductionGroup.id).all()
    ]


def get_production_group_by_id(
    db: Session, production_group_id: int, base_url: str
) -> ProductionGroupResponse:
    production_group = (
        db.query(ProductionGroup)
        .filter(ProductionGroup.id == production_group_id)
        .first()
    )
    if not production_group:
        raise NotFoundError("Series", production_group_id)

    return build_production_group_response(production_group, base_url)


def create_production_group(
    db: Session, production_group_in: ProductionGroupCreate, base_url: str
) -> ProductionGroupResponse:
    normalized_title = _normalize_production_group_title(production_group_in.title)
    _ensure_production_group_title_is_available(db, normalized_title)

    productions = _get_existing_productions(
        db, production_group_in.production_id_urls or []
    )
    production_group = ProductionGroup(
        title=normalized_title,
        is_public_filter=production_group_in.is_public_filter,
        productions=productions,
    )
    db.add(production_group)
    db.commit()
    db.refresh(production_group)

    return build_production_group_response(production_group, base_url)


def update_production_group(
    db: Session,
    production_group_id: int,
    production_group_in: ProductionGroupUpdate,
    base_url: str,
) -> ProductionGroupResponse:
    production_group = (
        db.query(ProductionGroup)
        .filter(ProductionGroup.id == production_group_id)
        .first()
    )
    if not production_group:
        raise NotFoundError("Series", production_group_id)

    update_data = production_group_in.model_dump(exclude_unset=True)
    production_id_urls = update_data.pop("production_id_urls", None)

    if "title" in update_data:
        normalized_title = _normalize_production_group_title(update_data["title"])
        _ensure_production_group_title_is_available(
            db,
            normalized_title,
            exclude_production_group_id=production_group_id,
        )
        update_data["title"] = normalized_title

    for field, value in update_data.items():
        setattr(production_group, field, value)

    if production_id_urls is not None:
        production_group.productions = _get_existing_productions(db, production_id_urls)

    db.commit()
    db.refresh(production_group)
    return build_production_group_response(production_group, base_url)


def delete_production_group_by_id(db: Session, production_group_id: int) -> bool:
    production_group = (
        db.query(ProductionGroup)
        .filter(ProductionGroup.id == production_group_id)
        .first()
    )
    if not production_group:
        raise NotFoundError("Series", production_group_id)

    db.delete(production_group)
    db.commit()
    return True
