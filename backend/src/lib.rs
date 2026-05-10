pub mod api;
pub mod config;
pub mod database;
pub mod errors;
pub mod models;
pub mod schemas;
pub mod services;
pub mod worker;

use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub settings: Arc<config::Settings>,
    pub s3: Arc<aws_sdk_s3::Client>,
}
