use axum::{extract::State, Json};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::statistics::StatisticsResponse;
use crate::services::statistics::get_statistics;
use crate::AppState;

pub async fn statistics_handler(
    State(state): State<AppState>,
    CurrentUser(_user): CurrentUser,
) -> Result<Json<StatisticsResponse>, AppError> {
    let result = get_statistics(&state.db).await?;
    Ok(Json(result))
}
