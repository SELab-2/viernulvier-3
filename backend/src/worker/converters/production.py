from src.models.production import ProdInfo, Production
from src.api.dependencies.language import get_accepted_language
from src.services.language import Languages
import logging

logger = logging.getLogger(__name__)


def api_prod_to_model_prod(json_prod: dict) -> Production:
    """
    This function takes care of molding the json response of the api for a
    production, into a Production object for our archive database.
    """
    production_id = int(json_prod["@id"].split("/")[-1])

    production = Production(
        viernulvier_id=production_id,
        performer_type=json_prod.get("performer_type"),
        attendance_mode=json_prod.get("attendance_mode"),
    )

    fields_to_check = (
        "title",
        "supertitle",
        "artist",
        "tagline",
        "teaser",
        "description",
    )

    appearing_languages = set()
    for field in fields_to_check:
        json_field = json_prod.get(field)
        if json_field:
            for lang_code in json_field.keys():
                appearing_languages.add(lang_code)

    # Little helper function to combat the None-iness possibilities
    def getty(key: str, lang_code: str):
        _item = json_prod.get(key)
        return _item.get(lang_code) if _item else None

    for lang_code in appearing_languages:
        lang = get_accepted_language(lang_code)
        if lang is None:
            logger.warning(
                f"ignoring language {lang_code} for Production(id={production_id})"
            )
            continue

        prod_info = ProdInfo(
            language=lang,
            title=getty("title", lang_code),
            supertitle=getty("supertitle", lang_code),
            artist=getty("artist", lang_code),
            tagline=getty("tagline", lang_code),
            teaser=getty("teaser", lang_code),
            description=getty("description", lang_code),
            info=getty("info", lang_code),
        )

        production.info.append(prod_info)

    return production


def csv_prod_to_model_prod(csv_prod: dict, tag_map: dict) -> Production:
    """
    This function takes care of molding the csv format of a production,
    into a Production object for our archive database.
    """
    production = Production(
        viernulvier_id=int(csv_prod[5]),
    )

    prod_info = ProdInfo(
        language=Languages.NEDERLANDS,
        title=csv_prod[0],
        supertitle=csv_prod[1],
        description=(csv_prod[2] + "\n" + csv_prod[3]),
    )

    genres = csv_prod[4].split(',')
    for genre in genres:
        production.tags.append(tag_map[genre])

    production.info.append(prod_info)

    return production
