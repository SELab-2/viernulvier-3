use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::api::dependencies::language::AcceptedLanguage;
use crate::errors::AppError;
use crate::schemas::blog::{BlogCreate, BlogListQuery, BlogListResponse, BlogResponse, BlogUpdate};
use crate::services::auth::permissions::{
    check_permission, PERMISSION_BLOG_READ, PERMISSION_BLOG_WRITE,
};
use crate::services::auth::user::get_user_permission_names;
use crate::services::blog::{create_blog, delete_blog, get_blog, list_blogs, update_blog};
use crate::AppState;

fn media_base_url(state: &AppState) -> String {
    format!(
        "{}/{}",
        state.settings.minio_endpoint.trim_end_matches('/'),
        state.settings.minio_bucket
    )
}

pub async fn list_blogs_handler(
    State(state): State<AppState>,
    AcceptedLanguage(language): AcceptedLanguage,
    CurrentUser(user): CurrentUser,
    Query(query): Query<BlogListQuery>,
) -> Result<Json<BlogListResponse>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_BLOG_READ)?;
    }
    let base_url = media_base_url(&state);
    let result = list_blogs(&state.db, query, language.as_deref(), &base_url).await?;
    Ok(Json(result))
}

pub async fn get_blog_handler(
    State(state): State<AppState>,
    AcceptedLanguage(language): AcceptedLanguage,
    CurrentUser(user): CurrentUser,
    Path(id): Path<i32>,
) -> Result<Json<BlogResponse>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_BLOG_READ)?;
    }
    let base_url = media_base_url(&state);
    let result = get_blog(&state.db, id, language.as_deref(), &base_url).await?;
    Ok(Json(result))
}

pub async fn create_blog_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(data): Json<BlogCreate>,
) -> Result<(StatusCode, Json<BlogResponse>), AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_BLOG_WRITE)?;
    }
    let base_url = media_base_url(&state);
    let result = create_blog(&state.db, data, &base_url).await?;
    Ok((StatusCode::CREATED, Json(result)))
}

pub async fn update_blog_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(id): Path<i32>,
    Json(data): Json<BlogUpdate>,
) -> Result<Json<BlogResponse>, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_BLOG_WRITE)?;
    }
    let base_url = media_base_url(&state);
    let result = update_blog(&state.db, id, data, &base_url).await?;
    Ok(Json(result))
}

pub async fn delete_blog_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(id): Path<i32>,
) -> Result<StatusCode, AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_BLOG_WRITE)?;
    }
    delete_blog(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
