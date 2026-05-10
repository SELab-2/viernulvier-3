use sqlx::PgPool;

use crate::errors::AppError;
use crate::schemas::statistics::StatisticsResponse;

pub async fn get_statistics(pool: &PgPool) -> Result<StatisticsResponse, AppError> {
    let productions_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM productions")
            .fetch_one(pool)
            .await
            .map_err(AppError::Database)?;

    let events_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM events")
            .fetch_one(pool)
            .await
            .map_err(AppError::Database)?;

    let blogs_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM blogs")
            .fetch_one(pool)
            .await
            .map_err(AppError::Database)?;

    Ok(StatisticsResponse {
        productions_count,
        events_count,
        blogs_count,
    })
}
