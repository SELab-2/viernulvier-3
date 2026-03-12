from src.models.production import ProdInfo, Production
import logging


def api_prod_to_model_prod(
    json_prod: dict, language_map: dict[str, int]
) -> tuple[Production, list[ProdInfo]]:
    """
    This function takes care of molding the json response of the api for a
    production, into a Production object for our archive database.
    """
    production_id = int(json_prod["@id"].split("/")[-1])

    production = Production(
        id=production_id,
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

    infos = []
    for lang_code in appearing_languages:
        lang_id = language_map.get(lang_code)
        if not lang_id:
            logging.warning(
                f"ignoring language {lang_code} for Production(id={production_id})"
            )
            continue

        prod_info = ProdInfo(
            production_id=production_id,
            language_id=lang_id,
            title=getty("title", lang_code),
            supertitle=getty("supertitle", lang_code),
            artist=getty("artist", lang_code),
            tagline=getty("tagline", lang_code),
            teaser=getty("teaser", lang_code),
            description=getty("description", lang_code),
            info=getty("info", lang_code),
        )

        infos.append(prod_info)

    return production, infos
