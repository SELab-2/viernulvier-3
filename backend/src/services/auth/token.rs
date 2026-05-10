use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};

use crate::errors::AppError;
use crate::schemas::auth::TokenClaims;

pub fn create_access_token(
    username: &str,
    token_version: i32,
    super_user: bool,
    secret: &str,
    expire_minutes: i64,
) -> Result<String, AppError> {
    let exp = (Utc::now() + chrono::Duration::minutes(expire_minutes)).timestamp();
    let claims = TokenClaims {
        sub: username.to_string(),
        exp,
        token_version,
        super_user,
        token_type: "access".to_string(),
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(e.to_string()))
}

pub fn create_refresh_token(
    username: &str,
    token_version: i32,
    super_user: bool,
    secret: &str,
    expire_minutes: i64,
) -> Result<String, AppError> {
    let exp = (Utc::now() + chrono::Duration::minutes(expire_minutes)).timestamp();
    let claims = TokenClaims {
        sub: username.to_string(),
        exp,
        token_version,
        super_user,
        token_type: "refresh".to_string(),
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(e.to_string()))
}

pub fn decode_token(token: &str, secret: &str) -> Result<TokenClaims, AppError> {
    decode::<TokenClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => AppError::Unauthorized,
        _ => AppError::Unauthorized,
    })
}
