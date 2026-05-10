use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::permission::Permission;
use crate::schemas::auth::PermissionResponse;

pub const PERMISSION_ARCHIVE_READ: &str = "archive:read";
pub const PERMISSION_ARCHIVE_WRITE: &str = "archive:write";
pub const PERMISSION_BLOG_READ: &str = "blog:read";
pub const PERMISSION_BLOG_WRITE: &str = "blog:write";
pub const PERMISSION_USER_READ: &str = "user:read";
pub const PERMISSION_USER_WRITE: &str = "user:write";

pub async fn get_all_permissions(pool: &PgPool) -> Result<Vec<PermissionResponse>, AppError> {
    let perms = sqlx::query_as::<_, Permission>("SELECT * FROM permissions ORDER BY id")
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?;
    Ok(perms
        .into_iter()
        .map(|p| PermissionResponse { id: p.id, name: p.name })
        .collect())
}

pub async fn create_permission(pool: &PgPool, name: &str) -> Result<PermissionResponse, AppError> {
    let perm = sqlx::query_as::<_, Permission>(
        "INSERT INTO permissions (name) VALUES ($1) RETURNING *",
    )
    .bind(name)
    .fetch_one(pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db_err)
            if db_err.constraint() == Some("permissions_name_key") =>
        {
            AppError::Conflict(format!("Permission '{}' already exists", name))
        }
        e => AppError::Database(e),
    })?;
    Ok(PermissionResponse { id: perm.id, name: perm.name })
}

pub fn check_permission(user_permissions: &[String], required: &str) -> Result<(), AppError> {
    if user_permissions.iter().any(|p| p == required) {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}
