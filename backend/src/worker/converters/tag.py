from src.models.tag import Tag, TagName
import logging

logger = logging.getLogger(__name__)


def api_tag_to_model_tag(
    json_tag: dict, language_map: dict[str, int]
) -> tuple[Tag, list[TagName]]:
    tag_id = int(json_tag["@id"].split("/")[-1])

    tag = Tag(id=tag_id)

    names = json_tag.get("name")
    tag_names = []
    if names:
        for lang_code in names.keys():
            lang_id = language_map.get(lang_code)
            if not lang_id:
                logger.warning(
                    f"ignoring language {lang_code} for Production(id={tag_id})"
                )
                continue

            tag_name = names[lang_code]
            tag_name_object = TagName(tag_id=tag_id, language_id=lang_id, name=tag_name)

            tag_names.append(tag_name_object)

    return tag, tag_names
