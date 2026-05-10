use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub hashed_password: String,
    pub token_version: i32,
    pub super_user: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct UserRole {
    pub user_id: i32,
    pub role_id: i32,
}
