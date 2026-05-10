pub mod archive;
pub mod auth;
pub mod status;

use axum::{routing::get, Router};

use crate::AppState;

use archive::archive_router;
use auth::auth_router;
use status::health;

pub fn v1_router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .nest("/archive", archive_router())
        .nest("/auth", auth_router())
}
