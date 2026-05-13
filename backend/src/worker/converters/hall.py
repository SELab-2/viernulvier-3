from src.models.hall import Hall, HallName
from src.api.dependencies.language import get_accepted_language
import logging

logger = logging.getLogger(__name__)


def get_address_from_location(json_location):
    """
    This function gets a nicely formatted address from the location data.
    It assumes that at least `street` and (`postal_code` or `city`) are present
    """

    street = json_location.get("street")
    number = json_location.get("number")
    postal_code = json_location.get("postal_code")
    city = json_location.get("city")
    country = json_location.get("country")

    address: str = street

    if number:
        address += f" {number}"

    address += ","

    if postal_code:
        address += " " + postal_code

    if city:
        address += " " + city

    if country:
        address += f" ({country})"

    return address


def api_hall_to_model_hall(
    json_hall: dict, space_names: dict, location_address: str
) -> Hall:
    vnv_id = int(json_hall.get("@id").split("/")[-1])

    address = ""
    using_spacename_as_address: bool = False
    if location_address:
        address = location_address
    else:
        # If no location_address is present, use the space name (nl with en fallback)
        # unless the space name is the same as the hall name, in that case we
        # just do not have an address
        address = space_names.get("nl") or space_names.get("en")
        using_spacename_as_address = True
        if address == json_hall["name"].get("nl"):
            address = None
            using_spacename_as_address = False

    names: list[HallName] = []

    for lang_code, name in json_hall["name"].items():
        lang = get_accepted_language(lang_code)
        if lang is None:
            logger.warning(
                f"ignoring language {lang_code} for Hall(viernulvier_id={vnv_id})"
            )
            continue

        if space_name := space_names.get(lang_code):
            if not using_spacename_as_address and space_name != name:
                name += f" ({space_name})"

        names.append(HallName(language=lang, name=name))

    return Hall(viernulvier_id=vnv_id, address=address, names=names)


def api_location_to_model_halls(json_location: dict) -> list[Hall]:
    location_address: str = ""
    if json_location.get("street") and (
        json_location.get("postal_code") or json_location.get("city")
    ):
        location_address = get_address_from_location(json_location)

    halls: list[Hall] = []

    for json_space in json_location.get("spaces") or []:
        space_names = json_space.get("name")

        for json_hall in json_space.get("halls") or []:
            halls.append(
                api_hall_to_model_hall(json_hall, space_names, location_address)
            )

    return halls
