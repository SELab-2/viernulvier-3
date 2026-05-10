use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0} with id {1} not found")]
    NotFound(String, String),

    #[error("{0}")]
    Validation(String),

    #[error("Could not validate credentials")]
    Unauthorized,

    #[error("Incorrect permissions")]
    Forbidden,

    #[error("{0}")]
    Conflict(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unsupported media type: {0}")]
    UnsupportedMediaType(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl AppError {
    pub fn not_found(resource: &str, id: impl ToString) -> Self {
        AppError::NotFound(resource.to_string(), id.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(_, _) => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, self.to_string()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::UnsupportedMediaType(msg) => {
                (StatusCode::UNSUPPORTED_MEDIA_TYPE, msg.clone())
            }
            AppError::Database(e) => {
                tracing::error!("Database error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
            AppError::Internal(msg) => {
                tracing::error!("Internal error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            }
        };
        (status, Json(json!({ "detail": message }))).into_response()
    }
}
