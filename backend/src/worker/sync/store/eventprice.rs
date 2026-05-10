use sqlx::PgPool;

use crate::errors::AppError;
use crate::worker::converters::eventprice::ConvertedEventPrice;

pub async fn upsert_event_price(
    pool: &PgPool,
    price: ConvertedEventPrice,
    event_id: i32,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO event_prices (viernulvier_id, event_id, amount, available, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (viernulvier_id) DO UPDATE SET
            event_id = EXCLUDED.event_id,
            amount = EXCLUDED.amount,
            available = EXCLUDED.available,
            expires_at = EXCLUDED.expires_at,
            updated_at = NOW()
        "#,
    )
    .bind(price.viernulvier_id)
    .bind(event_id)
    .bind(price.amount)
    .bind(price.available)
    .bind(price.expires_at)
    .execute(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}
