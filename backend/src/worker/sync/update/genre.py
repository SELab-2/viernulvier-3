import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from src.models.tag import Tag, TagName
from src.worker.converters.genres import api_genre_to_model_tag

logger = logging.getLogger(__name__)


def store_updated_genres(db_session: Session, genres: list[dict]):
    newest_timestamp = None

    for json_genre in genres:
        try:
            updated_tag: Tag = api_genre_to_model_tag(json_genre)

            # Find the tag to update in our database
            existing_tag: Tag = db_session.scalar(
                select(Tag).where(Tag.viernulvier_id == updated_tag.viernulvier_id)
            )

            # Drop unknown tags
            if not existing_tag:
                continue

            # Create map of language -> tagname for existing tag to potentially
            # update some entries
            existing_names_map: dict[str, TagName] = {
                name.language: name for name in existing_tag.names
            }
            # Update the names by iterating over it
            for updated_tag_name in updated_tag.names:
                # Check if it already exists
                if existing_tag_name := existing_names_map.get(
                    updated_tag_name.language
                ):
                    if existing_tag_name.name != updated_tag_name.name:
                        logger.info(
                            f"[UPDATE] tag_name for lang="
                            f"'{updated_tag_name.language}' changed from "
                            f"'{existing_tag_name.name}' to "
                            f"'{updated_tag_name.name}' "
                            f"for Tag(viernulvier_id={existing_tag.viernulvier_id})"
                        )
                        existing_tag_name.name = updated_tag_name.name

                else:
                    # Did not exist, and 'api_genre_to_model_tag()' already
                    # dropped unsupported languages, so go ahead and add it!
                    logger.info(
                        f"[UPDATE] Adding translation "
                        f"lang='{updated_tag_name.language}', "
                        f"name='{updated_tag_name.name}' "
                        f"to Tag(viernulvier_id={existing_tag.viernulvier_id})"
                    )
                    # New TagName instead of using old one for safety
                    # Should be fine to just use old one but he, paranoia right
                    existing_tag.names.append(
                        TagName(
                            language=updated_tag_name.language,
                            name=updated_tag_name.name,
                        )
                    )

            # Set newest_timestamp to later update sync_state DB table
            updated_at_str = json_genre.get("updated_at")
            if updated_at_str:
                updated_at = datetime.fromisoformat(updated_at_str)
                if newest_timestamp is None or updated_at > newest_timestamp:
                    newest_timestamp = updated_at

        except Exception as e:
            logger.error(f"Error updating genre ({json_genre}):\n{e}")

    return newest_timestamp
