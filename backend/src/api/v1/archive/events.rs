use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::event::{EventCreate, EventListQuery, EventResponse};
use crate::services::auth::permissions::{
    check_permission, PERMISSION_ARCHIVE_READ, PERMISSION_ARCHIVE_WRITE,
};
use crate::services::auth::user::get_user_permission_names;
use crate::services::event::{create_event, list_events};
use crate::AppState;

pub async fn list_events_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Query(query): Query<EventListQuery>,
) -> Result<Json<Vec<EventResponse>>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_READ)?;
    }
    let result = list_events(&state.db, query).await?;
    Ok(Json(result))
}

pub async fn create_event_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(data): Json<EventCreate>,
) -> Result<(StatusCode, Json<EventResponse>), AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_WRITE)?;
    }
    let result = create_event(&state.db, data).await?;
    Ok((StatusCode::CREATED, Json(result)))
}
