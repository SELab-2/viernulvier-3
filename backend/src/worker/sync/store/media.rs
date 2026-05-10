use sqlx::PgPool;

use crate::errors::AppError;

pub async fn upsert_production_media(
    pool: &PgPool,
    vnv_item_id: i32,
    production_id: i32,
    object_key: &str,
    content_type: &str,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO media (vnv_item_id, production_id, object_key, content_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (vnv_item_id) DO UPDATE SET
            production_id = EXCLUDED.production_id,
            object_key = EXCLUDED.object_key,
            content_type = EXCLUDED.content_type
        "#,
    )
    .bind(vnv_item_id)
    .bind(production_id)
    .bind(object_key)
    .bind(content_type)
    .execute(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}
