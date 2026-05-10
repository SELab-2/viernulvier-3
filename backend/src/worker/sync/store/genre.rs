use sqlx::PgPool;

use crate::errors::AppError;
use crate::worker::converters::genres::ConvertedGenre;

pub async fn upsert_genre_as_tag(pool: &PgPool, genre: ConvertedGenre) -> Result<i32, AppError> {
    let row: (i32,) = sqlx::query_as(
        r#"
        INSERT INTO tags (viernulvier_id)
        VALUES ($1)
        ON CONFLICT (viernulvier_id) DO UPDATE SET viernulvier_id = EXCLUDED.viernulvier_id
        RETURNING id
        "#,
    )
    .bind(genre.viernulvier_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    let tag_id = row.0;

    if let Some(name) = genre.name {
        sqlx::query(
            r#"
            INSERT INTO tag_names (tag_id, language, name)
            VALUES ($1, 'nl', $2)
            ON CONFLICT (tag_id, language) DO UPDATE SET name = EXCLUDED.name
            "#,
        )
        .bind(tag_id)
        .bind(&name)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;
    }

    Ok(tag_id)
}
