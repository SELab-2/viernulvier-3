from datetime import datetime

from src.models.event import EventPrice


def api_eventprice_to_model_eventprice(json_eventprice: dict) -> EventPrice:
    eventprice_id = int(json_eventprice["@id"].split("/")[-1])

    event_id = json_eventprice.get("event")
    if event_id:
        event_id = int(event_id.split("/")[-1])

    amount = json_eventprice.get("amount")
    if amount:
        amount = float(amount)

    available = json_eventprice.get("available")
    if available:
        available = int(available)

    expires_at = json_eventprice.get("expires_at")
    if expires_at and expires_at != "null":
        expires_at = datetime.fromisoformat(expires_at)

    event_price = EventPrice(
        id=eventprice_id,
        event_id=event_id,
        amount=amount,
        available=available,
        expires_at=expires_at,
    )

    return event_price
