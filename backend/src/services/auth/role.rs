use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::role::Role;
use crate::models::permission::Permission;
use crate::schemas::auth::{RoleResponse, PermissionResponse};

pub async fn get_all_roles(pool: &PgPool) -> Result<Vec<RoleResponse>, AppError> {
    let roles = sqlx::query_as::<_, Role>("SELECT * FROM roles ORDER BY id")
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?;

    let mut responses = Vec::with_capacity(roles.len());
    for role in roles {
        let perms = get_role_permissions(pool, role.id).await?;
        responses.push(RoleResponse {
            id: role.id,
            name: role.name,
            permissions: perms,
        });
    }
    Ok(responses)
}

pub async fn get_role_by_id(pool: &PgPool, role_id: i32) -> Result<RoleResponse, AppError> {
    let role = sqlx::query_as::<_, Role>("SELECT * FROM roles WHERE id = $1")
        .bind(role_id)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("Role".to_string(), role_id.to_string()),
            e => AppError::Database(e),
        })?;
    let perms = get_role_permissions(pool, role.id).await?;
    Ok(RoleResponse {
        id: role.id,
        name: role.name,
        permissions: perms,
    })
}

pub async fn create_role(pool: &PgPool, name: &str) -> Result<RoleResponse, AppError> {
    let role = sqlx::query_as::<_, Role>("INSERT INTO roles (name) VALUES ($1) RETURNING *")
        .bind(name)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(ref db_err)
                if db_err.constraint() == Some("roles_name_key") =>
            {
                AppError::Conflict(format!("Role '{}' already exists", name))
            }
            e => AppError::Database(e),
        })?;
    Ok(RoleResponse {
        id: role.id,
        name: role.name,
        permissions: vec![],
    })
}

pub async fn assign_permission_to_role(
    pool: &PgPool,
    role_id: i32,
    permission_id: i32,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(role_id)
    .bind(permission_id)
    .execute(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}

pub async fn remove_permission_from_role(
    pool: &PgPool,
    role_id: i32,
    permission_id: i32,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2")
        .bind(role_id)
        .bind(permission_id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;
    Ok(())
}

pub async fn assign_role_to_user(
    pool: &PgPool,
    user_id: i32,
    role_id: i32,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(user_id)
    .bind(role_id)
    .execute(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}

pub async fn remove_role_from_user(
    pool: &PgPool,
    user_id: i32,
    role_id: i32,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2")
        .bind(user_id)
        .bind(role_id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;
    Ok(())
}

pub async fn get_user_roles(pool: &PgPool, user_id: i32) -> Result<Vec<RoleResponse>, AppError> {
    let roles = sqlx::query_as::<_, Role>(
        r#"
        SELECT r.* FROM roles r
        JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = $1
        ORDER BY r.id
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;

    let mut responses = Vec::with_capacity(roles.len());
    for role in roles {
        let perms = get_role_permissions(pool, role.id).await?;
        responses.push(RoleResponse {
            id: role.id,
            name: role.name,
            permissions: perms,
        });
    }
    Ok(responses)
}

async fn get_role_permissions(pool: &PgPool, role_id: i32) -> Result<Vec<PermissionResponse>, AppError> {
    let perms = sqlx::query_as::<_, Permission>(
        r#"
        SELECT p.* FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        ORDER BY p.id
        "#,
    )
    .bind(role_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(perms.into_iter().map(|p| PermissionResponse { id: p.id, name: p.name }).collect())
}
