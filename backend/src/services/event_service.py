from sqlalchemy.orm import Session
from src.models import Event, Hall, EventPrice
from src.schemas.event import EventResponse, EventCreate, EventUpdate, PriceResponse
from src.schemas.hall import HallSchema
from fastapi import HTTPException
from typing import Any


def extract_id(url: str | None) -> int | None:
    if not url:
        return None
    return int(url.rstrip("/").split("/")[-1])


def build_event_response(
    db: Session,
    event: Event,
    base_url: str
) -> EventResponse:

    hall = db.query(Hall).filter(Hall.id == event.hall_id).first()

    prices_db = (
        db.query(EventPrice)
        .filter(EventPrice.event_id == event.id)
        .all()
    )

    price_urls = [
        f"{base_url}/events/{event.id}/prices/{price.id}"
        for price in prices_db
    ]

    return EventResponse(
        id=f"{base_url}/events/{event.id}",
        production_id=f"{base_url}/productions/{event.production_id}",
        hall_id=f"{base_url}/halls/{event.hall_id}",
        hall=HallSchema(
            name=hall.name,
            address=hall.address
        ) if hall else None,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        order_url=event.order_url,
        external_order_url=event.external_order_url,
        created_at=event.created_at,
        updated_at=event.updated_at,
        prices=price_urls
    )


def get_event_by_id(db: Session, event_id: int, base_url: str) -> EventResponse:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise ValueError("Event not found")

    return build_event_response(db, event, base_url)


def delete_event_by_id(db: Session, event_id: int) -> bool:
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        return False

    db.delete(event)
    db.commit()
    return True


def get_hall_by_id(db: Session, hall_id: int) -> Hall:
    return db.query(Hall).filter(Hall.id == hall_id).first()


def make_event(db: Session, event_in: EventCreate, base_url: str) -> EventResponse:

    production_id = extract_id(event_in.production_id)
    hall_id = extract_id(event_in.hall_id)

    # case 1: existing hall
    if hall_id is not None:
        db_hall = db.query(Hall).filter(Hall.id == hall_id).first()
        if not db_hall:
            raise ValueError("Hall not found")

    # case 2: create hall
    else:
        db_hall = Hall(**event_in.hall.model_dump())
        db.add(db_hall)
        db.flush()

    db_event = Event(
        production_id=production_id,
        hall_id=db_hall.id,
        starts_at=event_in.starts_at,
        ends_at=event_in.ends_at,
        order_url=event_in.order_url,
        external_order_url=event_in.external_order_url,
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return build_event_response(db, db_event, base_url)


def update_event(
    db: Session,
    event_id: int,
    update_data: EventUpdate,
    base_url: str
) -> EventResponse:

    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_dict: dict[str, Any] = update_data.model_dump(exclude_unset=True)

    # convert ids if present
    if "production_id" in update_dict:
        update_dict["production_id"] = extract_id(update_dict["production_id"])

    if "hall_id" in update_dict:
        hall_id = extract_id(update_dict["hall_id"])

        db_hall = db.query(Hall).filter(Hall.id == hall_id).first()

        if not db_hall:
            raise HTTPException(status_code=404, detail="Hall not found")

        update_dict["hall_id"] = hall_id

    for field, value in update_dict.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    return build_event_response(db, event, base_url)


def get_prices_for_event(db: Session, event_id: int, base_url: str) -> list[PriceResponse]:

    prices = (
        db.query(EventPrice)
        .filter(EventPrice.event_id == event_id)
        .all()
    )

    result = []

    for price in prices:
        result.append(
            PriceResponse(
                id=f"{base_url}/events/{event_id}/prices/{price.id}",
                label=price.label,
                amount=float(price.amount) if price.amount else None,
                available=price.available,
                expires_at=price.expires_at,
                created_at=price.created_at,
                updated_at=price.updated_at
            )
        )

    return result


def get_event_price(
    db: Session,
    event_id: int,
    price_id: int,
    base_url: str
) -> PriceResponse:

    price = (
        db.query(EventPrice)
        .filter(EventPrice.id == price_id)
        .filter(EventPrice.event_id == event_id)
        .first()
    )

    if not price:
        raise ValueError("Price not found")

    return PriceResponse(
        id=f"{base_url}/events/{event_id}/prices/{price.id}",
        label=price.label,
        amount=float(price.amount) if price.amount else None,
        available=price.available,
        expires_at=price.expires_at,
        created_at=price.created_at,
        updated_at=price.updated_at
    )