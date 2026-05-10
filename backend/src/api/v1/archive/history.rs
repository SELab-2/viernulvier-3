use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::history::{HistoryCreate, HistoryListQuery, HistoryResponse};
use crate::services::history::{create_or_update_history, list_history};
use crate::AppState;

pub async fn list_history_handler(
    State(state): State<AppState>,
    CurrentUser(_user): CurrentUser,
    Query(query): Query<HistoryListQuery>,
) -> Result<Json<Vec<HistoryResponse>>, AppError> {
    let result = list_history(&state.db, query).await?;
    Ok(Json(result))
}

pub async fn create_history_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(data): Json<HistoryCreate>,
) -> Result<(StatusCode, Json<HistoryResponse>), AppError> {
    if !user.super_user {
        return Err(AppError::Forbidden);
    }
    let result = create_or_update_history(&state.db, data).await?;
    Ok((StatusCode::CREATED, Json(result)))
}
