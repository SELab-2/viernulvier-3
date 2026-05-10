use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::hall::Hall;
use crate::schemas::hall::{HallCreate, HallListQuery, HallResponse};

fn to_response(h: Hall) -> HallResponse {
    HallResponse {
        id: h.id,
        address: h.address,
        name: h.name,
    }
}

pub async fn list_halls(pool: &PgPool, query: HallListQuery) -> Result<Vec<HallResponse>, AppError> {
    let limit = query.limit.unwrap_or(50).min(200);
    let cursor_id = query.cursor.unwrap_or(0);
    sqlx::query_as::<_, Hall>(
        "SELECT * FROM halls WHERE id > $1 ORDER BY id ASC LIMIT $2",
    )
    .bind(cursor_id)
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
    .map(|rows| rows.into_iter().map(to_response).collect())
}

pub async fn create_hall(pool: &PgPool, data: HallCreate) -> Result<HallResponse, AppError> {
    sqlx::query_as::<_, Hall>(
        "INSERT INTO halls (address, name) VALUES ($1, $2) RETURNING *",
    )
    .bind(data.address)
    .bind(data.name)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
    .map(to_response)
}
