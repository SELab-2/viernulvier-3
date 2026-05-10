use axum::Json;

use crate::schemas::status::StatusResponse;
use crate::services::status::get_status;

pub async fn health() -> Json<StatusResponse> {
    Json(get_status())
}
