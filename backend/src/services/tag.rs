use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::tag::{Tag, TagName};
use crate::schemas::tag::{TagCreate, TagListQuery, TagNameResponse, TagResponse};

async fn get_tag_names(pool: &PgPool, tag_id: i32) -> Result<Vec<TagNameResponse>, AppError> {
    let names = sqlx::query_as::<_, TagName>(
        "SELECT * FROM tag_names WHERE tag_id = $1 ORDER BY language",
    )
    .bind(tag_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(names
        .into_iter()
        .map(|n| TagNameResponse {
            tag_id: n.tag_id,
            language: n.language,
            name: n.name,
        })
        .collect())
}

pub async fn get_tags_for_production(
    pool: &PgPool,
    production_id: i32,
    language: Option<&str>,
) -> Result<Vec<TagResponse>, AppError> {
    let tags = sqlx::query_as::<_, Tag>(
        r#"
        SELECT t.* FROM tags t
        JOIN prod_tags pt ON pt.tag_id = t.id
        WHERE pt.production_id = $1
        ORDER BY t.id
        "#,
    )
    .bind(production_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;

    let mut responses = Vec::with_capacity(tags.len());
    for tag in tags {
        let names = if let Some(lang) = language {
            let filtered = sqlx::query_as::<_, TagName>(
                "SELECT * FROM tag_names WHERE tag_id = $1 AND language = $2",
            )
            .bind(tag.id)
            .bind(lang)
            .fetch_all(pool)
            .await
            .map_err(AppError::Database)?;
            filtered
                .into_iter()
                .map(|n| TagNameResponse {
                    tag_id: n.tag_id,
                    language: n.language,
                    name: n.name,
                })
                .collect()
        } else {
            get_tag_names(pool, tag.id).await?
        };
        responses.push(TagResponse {
            id: tag.id,
            viernulvier_id: tag.viernulvier_id,
            names,
        });
    }
    Ok(responses)
}

pub async fn list_tags(pool: &PgPool, query: TagListQuery) -> Result<Vec<TagResponse>, AppError> {
    let limit = query.limit.unwrap_or(50).min(200);
    let cursor_id = query.cursor.unwrap_or(0);
    let tags = sqlx::query_as::<_, Tag>(
        "SELECT * FROM tags WHERE id > $1 ORDER BY id ASC LIMIT $2",
    )
    .bind(cursor_id)
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;

    let mut responses = Vec::with_capacity(tags.len());
    for tag in tags {
        let names = get_tag_names(pool, tag.id).await?;
        responses.push(TagResponse {
            id: tag.id,
            viernulvier_id: tag.viernulvier_id,
            names,
        });
    }
    Ok(responses)
}

pub async fn create_tag(pool: &PgPool, data: TagCreate) -> Result<TagResponse, AppError> {
    let tag = sqlx::query_as::<_, Tag>(
        "INSERT INTO tags (viernulvier_id) VALUES ($1) RETURNING *",
    )
    .bind(data.viernulvier_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    let mut names = Vec::with_capacity(data.names.len());
    for name_create in data.names {
        let tn = sqlx::query_as::<_, TagName>(
            "INSERT INTO tag_names (tag_id, language, name) VALUES ($1, $2, $3) RETURNING *",
        )
        .bind(tag.id)
        .bind(&name_create.language)
        .bind(&name_create.name)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;
        names.push(TagNameResponse {
            tag_id: tn.tag_id,
            language: tn.language,
            name: tn.name,
        });
    }

    Ok(TagResponse {
        id: tag.id,
        viernulvier_id: tag.viernulvier_id,
        names,
    })
}
