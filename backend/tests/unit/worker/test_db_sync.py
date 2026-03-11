from datetime import datetime, timezone
from unittest.mock import MagicMock

from src.models.sync_state import ResourceType, SyncState, SyncType
from src.worker.sync.db_sync import get_last_sync, update_sync_state


# Tiny test to check if the last stored timestamp for a resource- and synctype
# is what we expect
def test_get_last_sync_returns_timestamp(db_session):
    ts = datetime(2024, 1, 1)

    state = SyncState(
        resource=ResourceType.EVENT,
        sync_type=SyncType.CREATED_AT,
        last_timestamp=ts,
    )
    db_session.add(state)
    db_session.commit()

    result = get_last_sync(db_session, ResourceType.EVENT, SyncType.CREATED_AT)

    assert result == ts


# Check if 'update_sync_state' does no commit
def test_update_sync_state_updates_timestamp_does_no_commit(db_session):
    ts = datetime(2024, 1, 1)
    new_ts = datetime(2024, 1, 2)

    state = SyncState(
        resource=ResourceType.EVENT,
        sync_type=SyncType.CREATED_AT,
        last_timestamp=ts,
    )

    db_session.add(state)
    db_session.commit()

    # Now override the commit method to check it is not called
    db_session.commit = MagicMock()

    update_sync_state(
        db_session,
        ResourceType.EVENT,
        SyncType.CREATED_AT,
        new_ts,
    )

    db_session.commit.assert_not_called()
