import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.tag import Tag
from src.worker.converters.production import api_prod_to_model_prod

logger = logging.getLogger(__name__)


def store_new_productions(db_session: Session, productions: list[dict]):
    newest_timestamp = None

    existing_tags = db_session.execute(select(Tag))
    tag_map: dict[int, Tag] = {tag.viernulvier_id: tag for (tag,) in existing_tags}

    for json_prod in productions:
        try:
            # The production contains a list of info's with its relation.
            # sqlalchemy should automatically create all the required objects.
            prod, vnv_tag_ids = api_prod_to_model_prod(json_prod)

            # Attach 'prod' to sql-alchemy session
            prod = db_session.merge(prod)

            tags = []
            for tag in vnv_tag_ids:
                internal_tag_id = tag_map.get(tag)
                if not internal_tag_id:
                    logger.warning(
                        f"Genre (id={tag}) does not exist in the database, skipping "
                        f"this tag for production (id={prod.viernulvier_id})"
                    )
                else:
                    tags.append(internal_tag_id)

            prod.tags.extend(tags)

            created_at = datetime.fromisoformat(json_prod["created_at"])
            if newest_timestamp is None or created_at > newest_timestamp:
                newest_timestamp = created_at

        except Exception as e:
            logger.warning(f"Error storing genre ({json_prod}):\n{e}")

    return newest_timestamp
