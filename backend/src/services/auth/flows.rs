use sqlx::PgPool;

use crate::config::Settings;
use crate::errors::AppError;
use crate::schemas::auth::TokenResponse;

use super::password::verify_password;
use super::token::{create_access_token, create_refresh_token, decode_token};
use super::user::{get_user_by_username, update_last_login};

pub async fn login_flow(
    pool: &PgPool,
    settings: &Settings,
    username: &str,
    password: &str,
) -> Result<TokenResponse, AppError> {
    let user = get_user_by_username(pool, username)
        .await
        .map_err(|_| AppError::Unauthorized)?;

    let valid = verify_password(password, &user.hashed_password)?;
    if !valid {
        return Err(AppError::Unauthorized);
    }

    update_last_login(pool, user.id).await?;

    let access = create_access_token(
        &user.username,
        user.token_version,
        user.super_user,
        &settings.jwt_secret_key,
        settings.access_token_expire_minutes,
    )?;
    let refresh = create_refresh_token(
        &user.username,
        user.token_version,
        user.super_user,
        &settings.jwt_secret_key,
        settings.refresh_token_expire_minutes,
    )?;

    Ok(TokenResponse {
        access_token: access,
        refresh_token: refresh,
        token_type: "bearer".to_string(),
    })
}

pub async fn refresh_flow(
    pool: &PgPool,
    settings: &Settings,
    refresh_token: &str,
) -> Result<TokenResponse, AppError> {
    let claims = decode_token(refresh_token, &settings.jwt_secret_key)?;

    if claims.token_type != "refresh" {
        return Err(AppError::Unauthorized);
    }

    let user = get_user_by_username(pool, &claims.sub)
        .await
        .map_err(|_| AppError::Unauthorized)?;

    if user.token_version != claims.token_version {
        return Err(AppError::Unauthorized);
    }

    let access = create_access_token(
        &user.username,
        user.token_version,
        user.super_user,
        &settings.jwt_secret_key,
        settings.access_token_expire_minutes,
    )?;
    let new_refresh = create_refresh_token(
        &user.username,
        user.token_version,
        user.super_user,
        &settings.jwt_secret_key,
        settings.refresh_token_expire_minutes,
    )?;

    Ok(TokenResponse {
        access_token: access,
        refresh_token: new_refresh,
        token_type: "bearer".to_string(),
    })
}
