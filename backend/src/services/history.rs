use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::history::History;
use crate::schemas::history::{HistoryCreate, HistoryListQuery, HistoryResponse};

pub async fn list_history(
    pool: &PgPool,
    query: HistoryListQuery,
) -> Result<Vec<HistoryResponse>, AppError> {
    let rows = if let Some(lang) = query.language {
        sqlx::query_as::<_, History>(
            "SELECT * FROM history WHERE language = $1 ORDER BY year DESC",
        )
        .bind(lang)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?
    } else {
        sqlx::query_as::<_, History>("SELECT * FROM history ORDER BY year DESC, language")
            .fetch_all(pool)
            .await
            .map_err(AppError::Database)?
    };

    Ok(rows
        .into_iter()
        .map(|h| HistoryResponse {
            year: h.year,
            language: h.language,
            title: h.title,
            content: h.content,
        })
        .collect())
}

pub async fn create_or_update_history(
    pool: &PgPool,
    data: HistoryCreate,
) -> Result<HistoryResponse, AppError> {
    let row = sqlx::query_as::<_, History>(
        r#"
        INSERT INTO history (year, language, title, content)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (year, language) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content
        RETURNING *
        "#,
    )
    .bind(data.year)
    .bind(&data.language)
    .bind(&data.title)
    .bind(&data.content)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    Ok(HistoryResponse {
        year: row.year,
        language: row.language,
        title: row.title,
        content: row.content,
    })
}
