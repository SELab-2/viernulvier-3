from sqlalchemy.orm import Session
from src.models.production import Production
from src.models import Event, Hall, EventPrice
from src.schemas.event import EventResponse, EventCreate, EventUpdate, PriceResponse
from src.schemas.hall import HallSchema
from typing import Any
from src.api.exceptions import NotFoundError, ValidationError


def extract_id(url: str | None) -> int | None:
    if not url:
        return None
    return int(url.rstrip("/").split("/")[-1])


def build_event_response(db: Session, event: Event, base_url: str) -> EventResponse:
    hall = db.query(Hall).filter(Hall.id == event.hall_id).first()

    prices_db = db.query(EventPrice).filter(EventPrice.event_id == event.id).all()

    price_urls = [
        f"{base_url}/events/{event.id}/prices/{price.id}" for price in prices_db
    ]

    return EventResponse(
        id_url=f"{base_url}/events/{event.id}",
        production_id_url=f"{base_url}/productions/{event.production_id}",
        hall_id_url=f"{base_url}/halls/{event.hall_id}",
        hall=HallSchema(name=hall.name, address=hall.address) if hall else None,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        order_url=event.order_url,
        created_at=event.created_at,
        updated_at=event.updated_at,
        price_urls=price_urls,
    )


def get_event_by_id(db: Session, event_id: int, base_url: str) -> EventResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise NotFoundError("Event", event_id)

    return build_event_response(db, event, base_url)


def delete_event_by_id(db: Session, event_id: int) -> bool:
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise NotFoundError("Event", event_id)

    db.delete(event)
    db.commit()
    return True


def get_hall_by_id(db: Session, hall_id: int) -> Hall:
    hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not hall:
        raise NotFoundError("Hall", hall_id)
    return hall


def create_event(db: Session, event_in: EventCreate, base_url: str) -> EventResponse:
    try:
        production_id = extract_id(event_in.production_id)
        hall_id = extract_id(event_in.hall_id)
    except ValueError:
        raise ValidationError("Invalid production_id or hall_id format")

    db_production = db.query(Production).filter(Production.id == production_id).first()
    if not db_production:
        raise NotFoundError("Production", production_id)

    db_hall = db.query(Hall).filter(Hall.id == hall_id).first()
    if not db_hall:
        raise NotFoundError("Hall", hall_id)

    if event_in.starts_at is not None and event_in.ends_at is not None:
        if event_in.ends_at <= event_in.starts_at:
            raise ValidationError("ends_at must be after starts_at")

    db_event = Event(
        production_id=production_id,
        hall_id=hall_id,
        starts_at=event_in.starts_at,
        ends_at=event_in.ends_at,
        order_url=event_in.order_url,
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return build_event_response(db, db_event, base_url)


def update_event(
    db: Session, event_id: int, update_data: EventUpdate, base_url: str
) -> EventResponse:
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise NotFoundError("Event", event_id)

    update_dict: dict[str, Any] = update_data.model_dump(exclude_unset=True)

    # hall_id update
    if "hall_id_url" in update_dict:
        try:
            hall_id = extract_id(update_dict["hall_id_url"])
        except ValueError:
            raise ValidationError("Invalid hall_id_url format")

        db_hall = db.query(Hall).filter(Hall.id == hall_id).first()
        if not db_hall:
            raise NotFoundError("Hall", hall_id)

        update_dict["hall_id_url"] = hall_id

    # production_id update
    if "production_id_url" in update_dict:
        try:
            production_id = extract_id(update_dict["production_id_url"])
        except ValueError:
            raise ValidationError("Invalid production_id_url format")

        db_production = (
            db.query(Production).filter(Production.id == production_id).first()
        )

        if not db_production:
            raise NotFoundError("Production", production_id)

        update_dict["production_id_url"] = production_id

    # starts_at / ends_at validation
    starts_at = update_dict.get("starts_at", event.starts_at)
    ends_at = update_dict.get("ends_at", event.ends_at)

    if ends_at is not None and starts_at is not None:
        if ends_at <= starts_at:
            raise ValidationError("ends_at must be after starts_at")

    # update fields
    for field, value in update_dict.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    return build_event_response(db, event, base_url)


def get_prices_for_event(
    db: Session, event_id: int, base_url: str
) -> list[PriceResponse]:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise NotFoundError("Event", event_id)

    prices = db.query(EventPrice).filter(EventPrice.event_id == event_id).all()

    result = []

    for price in prices:
        result.append(
            PriceResponse(
                id_url=f"{base_url}/events/{event_id}/prices/{price.id}",
                amount=float(price.amount) if price.amount else None,
                available=price.available,
                expires_at=price.expires_at,
                created_at=price.created_at,
                updated_at=price.updated_at,
            )
        )

    return result


def get_event_price(
    db: Session, event_id: int, price_id: int, base_url: str
) -> PriceResponse:
    price = (
        db.query(EventPrice)
        .filter(EventPrice.id == price_id)
        .filter(EventPrice.event_id == event_id)
        .first()
    )

    if not price:
        raise NotFoundError("Price", price_id)

    return PriceResponse(
        id_url=f"{base_url}/events/{event_id}/prices/{price.id}",
        amount=float(price.amount) if price.amount else None,
        available=price.available,
        expires_at=price.expires_at,
        created_at=price.created_at,
        updated_at=price.updated_at,
    )
