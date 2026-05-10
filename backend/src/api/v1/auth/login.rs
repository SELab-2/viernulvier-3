use axum::{extract::State, Json};

use crate::errors::AppError;
use crate::schemas::auth::{LoginRequest, RefreshRequest, TokenResponse};
use crate::services::auth::flows::{login_flow, refresh_flow};
use crate::AppState;

pub async fn login_handler(
    State(state): State<AppState>,
    Json(data): Json<LoginRequest>,
) -> Result<Json<TokenResponse>, AppError> {
    let result = login_flow(&state.db, &state.settings, &data.username, &data.password).await?;
    Ok(Json(result))
}

pub async fn refresh_handler(
    State(state): State<AppState>,
    Json(data): Json<RefreshRequest>,
) -> Result<Json<TokenResponse>, AppError> {
    let result = refresh_flow(&state.db, &state.settings, &data.refresh_token).await?;
    Ok(Json(result))
}
