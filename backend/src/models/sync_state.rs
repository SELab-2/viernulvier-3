use chrono::NaiveDateTime;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct SyncState {
    pub resource: String,
    pub sync_type: String,
    pub last_timestamp: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}
