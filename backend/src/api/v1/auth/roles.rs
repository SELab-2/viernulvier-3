use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::auth::{AssignPermissionRequest, RoleCreate, RoleResponse};
use crate::services::auth::role::{
    assign_permission_to_role, create_role, get_all_roles, get_role_by_id,
    remove_permission_from_role,
};
use crate::AppState;

pub async fn list_roles_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
) -> Result<Json<Vec<RoleResponse>>, AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    let result = get_all_roles(&state.db).await?;
    Ok(Json(result))
}

pub async fn create_role_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Json(data): Json<RoleCreate>,
) -> Result<(StatusCode, Json<RoleResponse>), AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    let result = create_role(&state.db, &data.name).await?;
    Ok((StatusCode::CREATED, Json(result)))
}

pub async fn get_role_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Path(role_id): Path<i32>,
) -> Result<Json<RoleResponse>, AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    let result = get_role_by_id(&state.db, role_id).await?;
    Ok(Json(result))
}

pub async fn assign_permission_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Path(role_id): Path<i32>,
    Json(data): Json<AssignPermissionRequest>,
) -> Result<StatusCode, AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    assign_permission_to_role(&state.db, role_id, data.permission_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_permission_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Path((role_id, permission_id)): Path<(i32, i32)>,
) -> Result<StatusCode, AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    remove_permission_from_role(&state.db, role_id, permission_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
