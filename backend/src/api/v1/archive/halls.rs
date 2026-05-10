use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::hall::{HallCreate, HallListQuery, HallResponse};
use crate::services::auth::permissions::{
    check_permission, PERMISSION_ARCHIVE_READ, PERMISSION_ARCHIVE_WRITE,
};
use crate::services::auth::user::get_user_permission_names;
use crate::services::hall::{create_hall, list_halls};
use crate::AppState;

pub async fn list_halls_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Query(query): Query<HallListQuery>,
) -> Result<Json<Vec<HallResponse>>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_READ)?;
    }
    let result = list_halls(&state.db, query).await?;
    Ok(Json(result))
}

pub async fn create_hall_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(data): Json<HallCreate>,
) -> Result<(StatusCode, Json<HallResponse>), AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_WRITE)?;
    }
    let result = create_hall(&state.db, data).await?;
    Ok((StatusCode::CREATED, Json(result)))
}
