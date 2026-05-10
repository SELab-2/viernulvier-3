use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::user::User;

pub async fn get_user_by_username(pool: &PgPool, username: &str) -> Result<User, AppError> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(username)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                AppError::NotFound("User".to_string(), username.to_string())
            }
            e => AppError::Database(e),
        })
}

pub async fn get_user_by_id(pool: &PgPool, user_id: i32) -> Result<User, AppError> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                AppError::NotFound("User".to_string(), user_id.to_string())
            }
            e => AppError::Database(e),
        })
}

pub async fn get_all_users(pool: &PgPool) -> Result<Vec<User>, AppError> {
    sqlx::query_as::<_, User>("SELECT * FROM users ORDER BY id")
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)
}

pub async fn get_user_permission_names(pool: &PgPool, user_id: i32) -> Result<Vec<String>, AppError> {
    let rows = sqlx::query_scalar::<_, String>(
        r#"
        SELECT DISTINCT p.name
        FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(rows)
}

pub async fn create_user(
    pool: &PgPool,
    username: &str,
    hashed_password: &str,
    super_user: bool,
) -> Result<User, AppError> {
    sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (username, hashed_password, super_user)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(username)
    .bind(hashed_password)
    .bind(super_user)
    .fetch_one(pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db_err) if db_err.constraint() == Some("users_username_key") => {
            AppError::Conflict(format!("Username '{}' already exists", username))
        }
        e => AppError::Database(e),
    })
}

pub async fn update_last_login(pool: &PgPool, user_id: i32) -> Result<(), AppError> {
    sqlx::query("UPDATE users SET last_login_at = NOW() WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;
    Ok(())
}

pub async fn increment_token_version(pool: &PgPool, user_id: i32) -> Result<(), AppError> {
    sqlx::query("UPDATE users SET token_version = token_version + 1 WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;
    Ok(())
}
