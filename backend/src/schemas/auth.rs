use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TokenClaims {
    pub sub: String,
    pub exp: i64,
    pub token_version: i32,
    pub super_user: bool,
    pub token_type: String,
}

#[derive(Debug, Deserialize)]
pub struct UserCreate {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub username: String,
    pub super_user: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub roles: Vec<RoleResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RoleCreate {
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct RoleResponse {
    pub id: i32,
    pub name: String,
    pub permissions: Vec<PermissionResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionCreate {
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct PermissionResponse {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct AssignRoleRequest {
    pub role_id: i32,
}

#[derive(Debug, Deserialize)]
pub struct AssignPermissionRequest {
    pub permission_id: i32,
}
