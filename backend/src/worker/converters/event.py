from datetime import datetime

from src.models.event import Event


def api_event_to_model_event(json_event: dict, language_map: dict[str, int]) -> Event:
    """
    This function takes care of molding the json response of the api for a
    production, into a Production object for our archive database.
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
        end_time = datetime.fromisoformat(json_event["ends_at"])

    order_urls = json_event.get("external_order_url")
    order_url = None
    if order_urls:
        order_urls = order_urls.values()
        if len(order_urls) > 0:
            order_url = order_urls[0]

    event = Event(
        id=event_id,
        production_id=production_id,
        starts_at=start_time,
        ends_at=end_time,
        order_url=order_url,
    )

    return event
