use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
};

use crate::errors::AppError;
use crate::models::user::User;
use crate::services::auth::token::decode_token;
use crate::services::auth::user::get_user_by_username;
use crate::AppState;

pub struct CurrentUser(pub User);

#[async_trait]
impl FromRequestParts<AppState> for CurrentUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AppError::Unauthorized)?;

        let claims = decode_token(token, &state.settings.jwt_secret_key)?;

        if claims.token_type != "access" {
            return Err(AppError::Unauthorized);
        }

        let user = get_user_by_username(&state.db, &claims.sub)
            .await
            .map_err(|_| AppError::Unauthorized)?;

        if user.token_version != claims.token_version {
            return Err(AppError::Unauthorized);
        }

        Ok(CurrentUser(user))
    }
}

pub struct OptionalUser(pub Option<User>);

#[async_trait]
impl FromRequestParts<AppState> for OptionalUser {
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");

        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            if let Ok(claims) = decode_token(token, &state.settings.jwt_secret_key) {
                if claims.token_type == "access" {
                    if let Ok(user) = get_user_by_username(&state.db, &claims.sub).await {
                        if user.token_version == claims.token_version {
                            return Ok(OptionalUser(Some(user)));
                        }
                    }
                }
            }
        }
        Ok(OptionalUser(None))
    }
}
