import logging

from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.sync_state import ResourceType, SyncState, SyncType

logger = logging.getLogger(__name__)


def get_last_sync(
    db_session: Session, resource_type: ResourceType, sync_type: SyncType
):
    """
    Query the `db_session` for the last synced item of given `resource_type`
    and `sync_type`.

    ---

    :param db_session: open database connection to query
    :param resource_type: type of resource to query for
    :param sync_type: type of sync (created_at/updated_at) to query for
    """
    query = select(SyncState).where(
        SyncState.resource == resource_type,
        SyncState.sync_type == sync_type,
    )

    result = db_session.execute(query).scalar_one_or_none()
    assert result is not None

    logger.debug(
        f"get_last_sync({resource_type}, {sync_type}) -> {result.last_timestamp}"
    )
    return result.last_timestamp


def update_sync_state(
    db_session: Session,
    resource: ResourceType, sync_type: SyncType,
    new_timestamp
):
    """
    Update the `db_session` with the `new_timestamp` for the given
    `resource_type` and `sync_type`.

    WARNING: does not commit to the database as this is supposed to happen
             together with updating the data!

    ---

    :param db_session: open database connection to query
    :param resource_type: type of resource to query for
    :param sync_type: type of sync (created_at/updated_at) to query for
    :param new_timestamp: new timestamp for the given res.- and sync types
    """
    state = (
        db_session.query(SyncState)
        .filter_by(resource=resource, sync_type=sync_type)
        .one_or_none()
    )

    assert state is not None
    state.last_timestamp = new_timestamp

    logger.debug(
        f"update_sync_state({resource}, {sync_type}) updates state timestamp to {
            state.last_timestamp
        }"
    )

    # No commit, happens inside the `sync_new_xxx()` so it commits together
    # with the actual new data
