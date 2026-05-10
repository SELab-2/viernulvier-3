use axum::{extract::State, Json};

use crate::api::dependencies::auth::CurrentUser;
use crate::api::dependencies::language::AcceptedLanguage;
use crate::errors::AppError;
use crate::schemas::artists::ArtistsListResponse;
use crate::services::artists::list_artists;
use crate::AppState;

pub async fn list_artists_handler(
    State(state): State<AppState>,
    CurrentUser(_user): CurrentUser,
    AcceptedLanguage(language): AcceptedLanguage,
) -> Result<Json<ArtistsListResponse>, AppError> {
    let result = list_artists(&state.db, language.as_deref()).await?;
    Ok(Json(result))
}
