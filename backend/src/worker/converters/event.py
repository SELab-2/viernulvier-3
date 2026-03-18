from datetime import datetime

from src.models.event import Event


def api_event_to_model_event(json_event: dict) -> tuple[Event, int | None]:
    """
    This function takes care of molding the json response of the api for an
    event, into an Event object for our archive database.

    If the json_event does not have a production id, the second element of the
    tuple will be None. The first will not be None so that the parsed id is
    still available.
    """
    event_id = int(json_event["@id"].split("/")[-1])

    production = json_event.get("production")
    production_id = None
    if production:
        production_id = production.get("@id")
        if production_id:
            production_id = int(production_id.split("/")[-1])

    start_time = None
    start_str = json_event.get("starts_at")
    if start_str and start_str.strip() != "null":
        start_time = datetime.fromisoformat(json_event["starts_at"])

    end_time = None
    end_str = json_event.get("ends_at")
    if end_str and end_str.strip() != "null":
        end_time = datetime.fromisoformat(end_str)

    order_urls = json_event.get("external_order_url")
    order_url = None
    if order_urls:
        order_urls = list(order_urls.values())
        if len(order_urls) > 0:
            order_url = order_urls[0]

    event = Event(
        viernulvier_id=event_id,
        starts_at=start_time,
        ends_at=end_time,
        order_url=order_url,
    )

    return event, production_id


def csv_event_to_model_event(prod_id: int, csv_event: list, hall_id: int, c: int) -> Event:
    """
    This function takes care of molding the csv format of an event,
    into an Event object for our archive database.
    """
    if int(csv_event[0][:4]) < 1970:
        csv_event[0] = "1970-01-01 00:00:00"
    if int(csv_event[1][:4]) < 1970:
        csv_event[1] = "1970-01-01 00:00:00"
    event = Event(
        viernulvier_id=c,
        production_id=prod_id,
        starts_at=datetime.fromisoformat(
            csv_event[0]
            ),
        ends_at=datetime.fromisoformat(
            csv_event[1]
            ),
        hall_id=hall_id,
    )

    return event
