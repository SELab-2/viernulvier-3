import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


# This is literally ONLY for local sqlite-based testing, because sqlite for
# some stupid reason does not support timezones which ruins my nice logic
def comparable(value):
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)

        return value.astimezone(timezone.utc)

    return value


def sync_simple_fields(
    existing_item, updated_item, simple_fields_to_sync, entity_label
):
    for field in simple_fields_to_sync:
        old = getattr(existing_item, field)
        new = getattr(updated_item, field)

        if comparable(old) != comparable(new):
            logger.info(
                f"[UPDATE] {field} changed from '{old}' to '{new}' "
                f"for {entity_label}(viernulvier_id={existing_item.viernulvier_id})"
            )
            setattr(existing_item, field, new)
