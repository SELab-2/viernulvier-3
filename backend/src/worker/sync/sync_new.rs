use sqlx::PgPool;

use crate::errors::AppError;
use crate::worker::vnv_wrapper::VnvClient;

use super::db_sync::{sync_event_prices, sync_events, sync_genres, sync_halls, sync_productions};

pub async fn run_full_sync(pool: &PgPool, client: &VnvClient) -> Result<(), AppError> {
    tracing::info!("Starting full sync");

    let hall_map = sync_halls(pool, client).await?;
    tracing::info!("Synced {} halls", hall_map.len());

    let prod_map = sync_productions(pool, client).await?;
    tracing::info!("Synced {} productions", prod_map.len());

    let event_map = sync_events(pool, client, &prod_map, &hall_map).await?;
    tracing::info!("Synced {} events", event_map.len());

    sync_event_prices(pool, client, &event_map).await?;
    tracing::info!("Synced event prices");

    let genre_map = sync_genres(pool, client).await?;
    tracing::info!("Synced {} genres/tags", genre_map.len());

    update_production_earliest_latest(pool).await?;
    tracing::info!("Updated earliest/latest timestamps");

    tracing::info!("Full sync complete");
    Ok(())
}

async fn update_production_earliest_latest(pool: &PgPool) -> Result<(), AppError> {
    sqlx::query(
        r#"
        UPDATE productions p SET
            earliest_at = sub.earliest,
            latest_at = sub.latest
        FROM (
            SELECT production_id,
                MIN(starts_at) AS earliest,
                MAX(ends_at) AS latest
            FROM events
            WHERE starts_at IS NOT NULL
            GROUP BY production_id
        ) sub
        WHERE p.id = sub.production_id
        "#,
    )
    .execute(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}
