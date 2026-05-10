use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::production_group::ProductionGroup;
use crate::schemas::production_group::{
    ProductionGroupCreate, ProductionGroupListQuery, ProductionGroupResponse,
};

fn to_response(g: ProductionGroup) -> ProductionGroupResponse {
    ProductionGroupResponse {
        id: g.id,
        title: g.title,
        is_public_filter: g.is_public_filter,
    }
}

pub async fn get_groups_for_production(
    pool: &PgPool,
    production_id: i32,
) -> Result<Vec<ProductionGroupResponse>, AppError> {
    sqlx::query_as::<_, ProductionGroup>(
        r#"
        SELECT pg.* FROM production_groups pg
        JOIN prod_groups pgr ON pgr.group_id = pg.id
        WHERE pgr.production_id = $1
        ORDER BY pg.id
        "#,
    )
    .bind(production_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
    .map(|rows| rows.into_iter().map(to_response).collect())
}

pub async fn list_production_groups(
    pool: &PgPool,
    query: ProductionGroupListQuery,
) -> Result<Vec<ProductionGroupResponse>, AppError> {
    let limit = query.limit.unwrap_or(50).min(200);
    let cursor_id = query.cursor.unwrap_or(0);
    sqlx::query_as::<_, ProductionGroup>(
        "SELECT * FROM production_groups WHERE id > $1 ORDER BY id ASC LIMIT $2",
    )
    .bind(cursor_id)
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
    .map(|rows| rows.into_iter().map(to_response).collect())
}

pub async fn create_production_group(
    pool: &PgPool,
    data: ProductionGroupCreate,
) -> Result<ProductionGroupResponse, AppError> {
    sqlx::query_as::<_, ProductionGroup>(
        "INSERT INTO production_groups (title, is_public_filter) VALUES ($1, $2) RETURNING *",
    )
    .bind(data.title)
    .bind(data.is_public_filter)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
    .map(to_response)
}
