use axum::{
    extract::State,
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::auth::{PermissionCreate, PermissionResponse};
use crate::services::auth::permissions::{create_permission, get_all_permissions};
use crate::AppState;

pub async fn list_permissions_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
) -> Result<Json<Vec<PermissionResponse>>, AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    let result = get_all_permissions(&state.db).await?;
    Ok(Json(result))
}

pub async fn create_permission_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Json(data): Json<PermissionCreate>,
) -> Result<(StatusCode, Json<PermissionResponse>), AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    let result = create_permission(&state.db, &data.name).await?;
    Ok((StatusCode::CREATED, Json(result)))
}
