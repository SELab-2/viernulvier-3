import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.tag import Tag
from src.models.production import Production, ProdInfo
from src.worker.converters.production import api_prod_to_model_prod
from src.worker.sync.update.utils import sync_simple_fields

logger = logging.getLogger(__name__)


def store_updated_productions(db_session: Session, productions: list[dict]):
    newest_timestamp = None

    # Get all the existing tags to be able to check whether the passed
    # viernulvier_tag_id's are valid
    all_existing_tags = db_session.scalars(select(Tag))
    all_tags_map: dict[int, Tag] = {
        tag.viernulvier_id: tag for tag in all_existing_tags
    }

    for json_prod in productions:
        try:
            # The production contains a list of info's with its relation.
            # sqlalchemy should automatically create all the required objects.
            updated_prod, updated_vnv_tag_ids = api_prod_to_model_prod(json_prod)

            existing_prod: Production = db_session.scalar(
                select(Production).where(
                    Production.viernulvier_id == updated_prod.viernulvier_id
                )
            )

            # Skip unknown productions
            if not existing_prod:
                continue

            # Update tags
            _store_updated_tags_for_prod(
                db_session,
                existing_prod,
                updated_vnv_tag_ids,
                all_tags_map,
            )

            # Update the prod-info's
            existing_prod_languages: dict[str, ProdInfo] = {
                info.language: info for info in existing_prod.info
            }
            for updated_prod_info in updated_prod.info:
                if updated_prod_info.language in existing_prod_languages:
                    _apply_and_log_info_diff(
                        existing_prod_languages[updated_prod_info.language],
                        updated_prod_info,
                    )
                else:
                    logger.info(
                        f"[UPDATE] adding new translation for language="
                        f"{updated_prod_info.language} "
                        f"to Production(viernulvier_id={existing_prod.viernulvier_id})"
                    )
                    existing_prod.info.append(
                        ProdInfo(
                            language=updated_prod_info.language,
                            title=updated_prod_info.title,
                            supertitle=updated_prod_info.supertitle,
                            artist=updated_prod_info.artist,
                            tagline=updated_prod_info.tagline,
                            teaser=updated_prod_info.teaser,
                            description=updated_prod_info.description,
                            info=updated_prod_info.info,
                        )
                    )

            # Update the simple fields
            sync_simple_fields(
                existing_prod,
                updated_prod,
                ["performer_type", "attendance_mode"],
                "Production",
            )

            # Set newest_timestamp to later update sync_state DB table
            updated_at_str = json_prod.get("updated_at")
            if updated_at_str:
                updated_at = datetime.fromisoformat(updated_at_str)
                if newest_timestamp is None or updated_at > newest_timestamp:
                    newest_timestamp = updated_at

        except Exception as e:
            logger.error(f"Error updating production ({json_prod}):\n{e}")

    return newest_timestamp


def _store_updated_tags_for_prod(
    db_session: Session,
    existing_prod: Production,
    updated_vnv_tag_ids: list[int],
    all_tags_map: dict[int, Tag],
):
    # Calculate the diff between the tags currently attached to the production
    # and those found in the updated production.
    # Used solely to print out the diff.
    existing_tags: list[Tag] = existing_prod.tags
    existing_tags_vnv_id_set = {tag.viernulvier_id for tag in existing_tags}
    updated_tags_vnv_id_set = set(updated_vnv_tag_ids)

    tag_vnv_ids_to_remove = existing_tags_vnv_id_set - updated_tags_vnv_id_set
    tag_vnv_ids_to_add = updated_tags_vnv_id_set - existing_tags_vnv_id_set

    # Log which tags are being removed
    if len(tag_vnv_ids_to_remove) > 0:
        logger.info(
            f"[UPDATE] removing tags "
            f"(viernulvier_ids={sorted(tag_vnv_ids_to_remove)})"
            f"for Production(viernulvier_id={existing_prod.viernulvier_id})"
        )

    # Check that all tags to add are valid (inside our database)
    the_new_list_of_tags = []
    for updated_vnv_tag_id in updated_vnv_tag_ids:
        internal_tag = all_tags_map.get(updated_vnv_tag_id)
        if not internal_tag:
            logger.warning(
                f"[UPDATE] Genre(viernulvier_id={updated_vnv_tag_id}) "
                f"does not exist in the database, skipping this tag for "
                f"Production(viernulvier_id={existing_prod.viernulvier_id})"
            )
            # If the invalid tag was inside set of tags to add, remove
            # it (would generate a Foreign Key Violation otherwise)
            if updated_vnv_tag_id in tag_vnv_ids_to_add:
                tag_vnv_ids_to_add.remove(updated_vnv_tag_id)
        else:
            the_new_list_of_tags.append(internal_tag)

    # Log which tags are being added
    if len(tag_vnv_ids_to_add) > 0:
        logger.info(
            f"[UPDATE] adding tags "
            f"(viernulvier_ids={sorted(tag_vnv_ids_to_add)})"
            f"to Production(viernulvier_id={existing_prod.viernulvier_id})"
        )

    # Actually assign the new tags
    existing_prod.tags = the_new_list_of_tags


def _apply_and_log_info_diff(existing_info: ProdInfo, updated_info: ProdInfo):
    """
    Checks the ProdInfo field by field. If there is a difference, it logs and
    applies it. Other fields are left alone.
    """
    fields: list[str] = [
        "title",
        "supertitle",
        "artist",
        "tagline",
        "teaser",
        "description",
        "info",
    ]

    for field in fields:
        old = getattr(existing_info, field)
        new = getattr(updated_info, field)

        if old != new:
            logger.info(
                f"[UPDATE] {field} changed from '{old}' to '{new}' "
                f"for language={existing_info.language} of Production("
                f"viernulvier_id={existing_info.production.viernulvier_id})"
            )
            setattr(existing_info, field, new)
