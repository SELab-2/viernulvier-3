use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::api::dependencies::language::AcceptedLanguage;
use crate::errors::AppError;
use crate::schemas::production::{
    ProductionCreate, ProductionListQuery, ProductionListResponse, ProductionResponse,
    ProductionUpdate,
};
use crate::services::auth::permissions::{
    check_permission, PERMISSION_ARCHIVE_READ, PERMISSION_ARCHIVE_WRITE,
};
use crate::services::auth::user::get_user_permission_names;
use crate::services::production::{
    create_production, delete_production, get_production, list_productions, update_production,
};
use crate::AppState;

fn media_base_url(state: &AppState) -> String {
    format!(
        "{}/{}",
        state.settings.minio_endpoint.trim_end_matches('/'),
        state.settings.minio_bucket
    )
}

pub async fn list_productions_handler(
    State(state): State<AppState>,
    AcceptedLanguage(language): AcceptedLanguage,
    CurrentUser(user): CurrentUser,
    Query(query): Query<ProductionListQuery>,
) -> Result<Json<ProductionListResponse>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_READ)?;
    }
    let base_url = media_base_url(&state);
    let result = list_productions(
        &state.db,
        query.cursor.as_deref(),
        query.limit,
        query.tag_id,
        query.group_id,
        query.search.as_deref(),
        language.as_deref(),
        &base_url,
    )
    .await?;
    Ok(Json(result))
}

pub async fn get_production_handler(
    State(state): State<AppState>,
    AcceptedLanguage(language): AcceptedLanguage,
    CurrentUser(user): CurrentUser,
    Path(id): Path<i32>,
) -> Result<Json<ProductionResponse>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_READ)?;
    }
    let base_url = media_base_url(&state);
    let result = get_production(&state.db, id, language.as_deref(), &base_url).await?;
    Ok(Json(result))
}

pub async fn create_production_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(data): Json<ProductionCreate>,
) -> Result<(StatusCode, Json<ProductionResponse>), AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_WRITE)?;
    }
    let base_url = media_base_url(&state);
    let result = create_production(&state.db, data, &base_url).await?;
    Ok((StatusCode::CREATED, Json(result)))
}

pub async fn update_production_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(id): Path<i32>,
    Json(data): Json<ProductionUpdate>,
) -> Result<Json<ProductionResponse>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_WRITE)?;
    }
    let base_url = media_base_url(&state);
    let result = update_production(&state.db, id, data, &base_url).await?;
    Ok(Json(result))
}

pub async fn delete_production_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(id): Path<i32>,
) -> Result<StatusCode, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_WRITE)?;
    }
    delete_production(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
