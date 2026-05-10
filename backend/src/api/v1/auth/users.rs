use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::auth::{AssignRoleRequest, UserCreate, UserResponse};
use crate::services::auth::password::hash_password;
use crate::services::auth::role::{assign_role_to_user, get_user_roles, remove_role_from_user};
use crate::services::auth::user::{create_user, get_all_users, get_user_by_id};
use crate::AppState;

async fn build_user_response(
    state: &AppState,
    user: crate::models::user::User,
) -> Result<UserResponse, AppError> {
    let roles = get_user_roles(&state.db, user.id).await?;
    Ok(UserResponse {
        id: user.id,
        username: user.username,
        super_user: user.super_user,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        roles,
    })
}

pub async fn list_users_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    let users = get_all_users(&state.db).await?;
    let mut responses = Vec::with_capacity(users.len());
    for user in users {
        responses.push(build_user_response(&state, user).await?);
    }
    Ok(Json(responses))
}

pub async fn create_user_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Json(data): Json<UserCreate>,
) -> Result<(StatusCode, Json<UserResponse>), AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    let hashed = hash_password(&data.password)?;
    let user = create_user(&state.db, &data.username, &hashed, false).await?;
    let response = build_user_response(&state, user).await?;
    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn get_user_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Path(user_id): Path<i32>,
) -> Result<Json<UserResponse>, AppError> {
    if !caller.super_user && caller.id != user_id {
        return Err(AppError::Forbidden);
    }
    let user = get_user_by_id(&state.db, user_id).await?;
    let response = build_user_response(&state, user).await?;
    Ok(Json(response))
}

pub async fn assign_role_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Path(user_id): Path<i32>,
    Json(data): Json<AssignRoleRequest>,
) -> Result<StatusCode, AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    assign_role_to_user(&state.db, user_id, data.role_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_role_handler(
    State(state): State<AppState>,
    CurrentUser(caller): CurrentUser,
    Path((user_id, role_id)): Path<(i32, i32)>,
) -> Result<StatusCode, AppError> {
    if !caller.super_user {
        return Err(AppError::Forbidden);
    }
    remove_role_from_user(&state.db, user_id, role_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
