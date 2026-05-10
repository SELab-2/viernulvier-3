use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::production_group::{
    ProductionGroupCreate, ProductionGroupListQuery, ProductionGroupResponse,
};
use crate::services::auth::permissions::{
    check_permission, PERMISSION_ARCHIVE_READ, PERMISSION_ARCHIVE_WRITE,
};
use crate::services::auth::user::get_user_permission_names;
use crate::services::production_group::{create_production_group, list_production_groups};
use crate::AppState;

pub async fn list_production_groups_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Query(query): Query<ProductionGroupListQuery>,
) -> Result<Json<Vec<ProductionGroupResponse>>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_READ)?;
    }
    let result = list_production_groups(&state.db, query).await?;
    Ok(Json(result))
}

pub async fn create_production_group_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(data): Json<ProductionGroupCreate>,
) -> Result<(StatusCode, Json<ProductionGroupResponse>), AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_ARCHIVE_WRITE)?;
    }
    let result = create_production_group(&state.db, data).await?;
    Ok((StatusCode::CREATED, Json(result)))
}
