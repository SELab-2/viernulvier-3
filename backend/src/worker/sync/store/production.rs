use sqlx::PgPool;

use crate::errors::AppError;
use crate::worker::converters::production::ConvertedProduction;

pub async fn upsert_production(pool: &PgPool, prod: ConvertedProduction) -> Result<i32, AppError> {
    let row: (i32,) = sqlx::query_as(
        r#"
        INSERT INTO productions (viernulvier_id, performer_type, attendance_mode)
        VALUES ($1, $2, $3)
        ON CONFLICT (viernulvier_id) DO UPDATE SET
            performer_type = EXCLUDED.performer_type,
            attendance_mode = EXCLUDED.attendance_mode,
            updated_at = NOW()
        RETURNING id
        "#,
    )
    .bind(prod.viernulvier_id)
    .bind(&prod.performer_type)
    .bind(&prod.attendance_mode)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    let production_id = row.0;

    sqlx::query(
        r#"
        INSERT INTO prod_info (production_id, language, title, artist, tagline, teaser, description)
        VALUES ($1, 'nl', $2, $3, $4, $5, $6)
        ON CONFLICT (production_id, language) DO UPDATE SET
            title = COALESCE(EXCLUDED.title, prod_info.title),
            artist = COALESCE(EXCLUDED.artist, prod_info.artist),
            tagline = COALESCE(EXCLUDED.tagline, prod_info.tagline),
            teaser = COALESCE(EXCLUDED.teaser, prod_info.teaser),
            description = COALESCE(EXCLUDED.description, prod_info.description)
        "#,
    )
    .bind(production_id)
    .bind(&prod.title_nl)
    .bind(&prod.artist_nl)
    .bind(&prod.tagline_nl)
    .bind(&prod.teaser_nl)
    .bind(&prod.description_nl)
    .execute(pool)
    .await
    .map_err(AppError::Database)?;

    Ok(production_id)
}
