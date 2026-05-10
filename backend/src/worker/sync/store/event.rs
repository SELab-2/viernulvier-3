use sqlx::PgPool;

use crate::errors::AppError;
use crate::worker::converters::event::ConvertedEvent;

pub async fn upsert_event(
    pool: &PgPool,
    event: ConvertedEvent,
    production_id: i32,
    hall_id: Option<i32>,
) -> Result<i32, AppError> {
    let row: (i32,) = sqlx::query_as(
        r#"
        INSERT INTO events (viernulvier_id, production_id, hall_id, starts_at, ends_at, order_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (viernulvier_id) DO UPDATE SET
            production_id = EXCLUDED.production_id,
            hall_id = EXCLUDED.hall_id,
            starts_at = EXCLUDED.starts_at,
            ends_at = EXCLUDED.ends_at,
            order_url = EXCLUDED.order_url,
            updated_at = NOW()
        RETURNING id
        "#,
    )
    .bind(event.viernulvier_id)
    .bind(production_id)
    .bind(hall_id)
    .bind(event.starts_at)
    .bind(event.ends_at)
    .bind(&event.order_url)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    Ok(row.0)
}
