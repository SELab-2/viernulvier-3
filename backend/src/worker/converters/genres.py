from src.models.tag import Tag, TagName
from src.services.language import Languages
from src.api.dependencies.language import get_accepted_language
import logging

logger = logging.getLogger(__name__)


def api_genre_to_model_tag(json_genre: dict) -> tuple[Tag, list[TagName]]:
    genre_id = int(json_genre["@id"].split("/")[-1])

    genre = Tag(viernulvier_id=genre_id, viernulvier_use="genre")

    names = json_genre.get("name")
    genre_names = []
    if names:
        for lang_code in names.keys():
            lang = get_accepted_language(lang_code)
            if lang is None:
                logger.warning(f"ignoring language {lang_code} for Tag(id={genre_id})")
                continue

            genre_name = names[lang_code]
            genre_name_object = TagName(tag_id=genre_id, language=lang, name=genre_name)

            genre_names.append(genre_name_object)
    else:
        name = json_genre.get("vendor_id")
        if name:
            genre_name_object = TagName(
                tag_id=genre_id, language=Languages.NEDERLANDS, name=name
            )
            genre_names.append(genre_name_object)

    return genre, genre_names
