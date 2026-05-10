use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::tag::{TagCreate, TagListQuery, TagResponse};
use crate::services::auth::permissions::{
    check_permission, PERMISSION_ARCHIVE_READ, PERMISSION_ARCHIVE_WRITE,
};
use crate::services::auth::user::get_user_permission_names;
use crate::services::tag::{create_tag, list_tags};
use crate::AppState;

pub async fn list_tags_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Query(query): Query<TagListQuery>,
) -> Result<Json<Vec<TagResponse>>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_READ)?;
    }
    let result = list_tags(&state.db, query).await?;
    Ok(Json(result))
}

pub async fn create_tag_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(data): Json<TagCreate>,
) -> Result<(StatusCode, Json<TagResponse>), AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_WRITE)?;
    }
    let result = create_tag(&state.db, data).await?;
    Ok((StatusCode::CREATED, Json(result)))
}
