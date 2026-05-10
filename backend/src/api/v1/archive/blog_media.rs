use axum::{
    extract::{Multipart, Path, State},
    http::StatusCode,
    Json,
};

use crate::api::dependencies::auth::CurrentUser;
use crate::errors::AppError;
use crate::schemas::media::MediaResponse;
use crate::services::auth::permissions::{check_permission, PERMISSION_BLOG_WRITE};
use crate::services::auth::user::get_user_permission_names;
use crate::services::media::upload_blog_media;
use crate::AppState;

pub async fn upload_blog_media_handler(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(blog_id): Path<i32>,
    multipart: Multipart,
) -> Result<(StatusCode, Json<MediaResponse>), AppError> {
    let perms = get_user_permission_names(&state.db, user.id).await?;
    if !user.super_user {
        check_permission(&perms, PERMISSION_BLOG_WRITE)?;
    }
    let result = upload_blog_media(
        &state.db,
        state.s3.clone(),
        state.settings.clone(),
        blog_id,
        multipart,
    )
    .await?;
    Ok((StatusCode::CREATED, Json(result)))
}
