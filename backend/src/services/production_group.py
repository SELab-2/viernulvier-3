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
        id_url=f"{base_url}/production-groups/{production_group.id}",
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
            int(production_url.rstrip("/").split("/")[-1])
            for production_url in production_id_urls
        ]
    except (TypeError, ValueError, IndexError):
        raise ValidationError(
            "production_id_urls must end with integer production ids."
        )


def _get_existing_productions(
    db: Session, production_id_urls: list[str]
) -> list[Production]:
    production_ids = _parse_production_ids(production_id_urls)
    if not production_ids:
        return []

    productions = db.query(Production).filter(Production.id.in_(production_ids)).all()
    existing_ids = {production.id for production in productions}
    missing_ids = set(production_ids) - existing_ids
    if missing_ids:
        raise ValidationError(f"Productions do not exist: {missing_ids}")
    return productions


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
        raise NotFoundError("Production group", production_group_id)

    return build_production_group_response(production_group, base_url)


def create_production_group(
    db: Session, production_group_in: ProductionGroupCreate, base_url: str
) -> ProductionGroupResponse:
    productions = _get_existing_productions(
        db, production_group_in.production_id_urls or []
    )
    production_group = ProductionGroup(
        title=production_group_in.title,
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
        raise NotFoundError("Production group", production_group_id)

    update_data = production_group_in.model_dump(exclude_unset=True)
    production_id_urls = update_data.pop("production_id_urls", None)
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
        raise NotFoundError("Production group", production_group_id)

    db.delete(production_group)
    db.commit()
    return True
