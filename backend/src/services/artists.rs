use sqlx::PgPool;

use crate::errors::AppError;
use crate::schemas::artists::{ArtistResponse, ArtistsListResponse};

pub async fn list_artists(
    pool: &PgPool,
    language: Option<&str>,
) -> Result<ArtistsListResponse, AppError> {
    let lang = language.unwrap_or("nl");
    let rows = sqlx::query_scalar::<_, String>(
        r#"
        SELECT DISTINCT artist FROM prod_info
        WHERE language = $1 AND artist IS NOT NULL AND artist <> ''
        ORDER BY artist
        "#,
    )
    .bind(lang)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;

    let items: Vec<ArtistResponse> = rows.into_iter().map(|a| ArtistResponse { artist: a }).collect();
    let count = items.len();
    Ok(ArtistsListResponse { items, count })
}
