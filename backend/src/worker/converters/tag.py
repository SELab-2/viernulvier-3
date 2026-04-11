from src.models.tag import Tag, TagName
from src.api.dependencies.language import get_accepted_language
import logging

logger = logging.getLogger(__name__)


def api_tag_to_model_tag(json_tag: dict) -> tuple[Tag, list[TagName]]:
    tag_id = int(json_tag["@id"].split("/")[-1])

    tag = Tag(viernulvier_id=tag_id, viernulvier_use="tag")

    names = json_tag.get("name")
    tag_names = []
    if names:
        for lang_code in names.keys():
            lang = get_accepted_language(lang_code)
            if lang is None:
                logger.warning(
                    f"ignoring language {lang_code} for Tag(id={tag_id})"
                )
                continue

            tag_name = names[lang_code]
            tag_name_object = TagName(tag_id=tag_id, language=lang, name=tag_name)

            tag_names.append(tag_name_object)

    return tag, tag_names
