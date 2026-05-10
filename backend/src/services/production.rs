use chrono::NaiveDateTime;
use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::production::{ProdInfo, Production};
use crate::schemas::pagination::{decode_cursor, encode_cursor};
use crate::schemas::production::{
    ProdInfoResponse, ProductionCreate, ProductionListResponse, ProductionResponse,
    ProductionUpdate,
};

use super::event::get_events_for_production;
use super::media::get_media_for_production;
use super::production_group::get_groups_for_production;
use super::tag::get_tags_for_production;

const DEFAULT_LIMIT: i64 = 20;

async fn build_production_response(
    pool: &PgPool,
    prod: Production,
    language: Option<&str>,
    base_url: &str,
) -> Result<ProductionResponse, AppError> {
    let info = if let Some(lang) = language {
        get_prod_info(pool, prod.id, lang).await.ok()
    } else {
        None
    };
    let tags = get_tags_for_production(pool, prod.id, language).await?;
    let groups = get_groups_for_production(pool, prod.id).await?;
    let events = get_events_for_production(pool, prod.id).await?;
    let media = get_media_for_production(pool, prod.id, base_url).await?;

    Ok(ProductionResponse {
        id: prod.id,
        viernulvier_id: prod.viernulvier_id,
        performer_type: prod.performer_type,
        attendance_mode: prod.attendance_mode,
        created_at: prod.created_at,
        updated_at: prod.updated_at,
        earliest_at: prod.earliest_at,
        latest_at: prod.latest_at,
        info,
        tags,
        groups,
        events,
        media,
    })
}

async fn get_prod_info(
    pool: &PgPool,
    production_id: i32,
    language: &str,
) -> Result<ProdInfoResponse, AppError> {
    let info = sqlx::query_as::<_, ProdInfo>(
        "SELECT * FROM prod_info WHERE production_id = $1 AND language = $2",
    )
    .bind(production_id)
    .bind(language)
    .fetch_one(pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => {
            AppError::NotFound("ProdInfo".to_string(), production_id.to_string())
        }
        e => AppError::Database(e),
    })?;

    Ok(ProdInfoResponse {
        production_id: info.production_id,
        language: info.language,
        title: info.title,
        supertitle: info.supertitle,
        artist: info.artist,
        tagline: info.tagline,
        teaser: info.teaser,
        description: info.description,
        info: info.info,
    })
}

#[allow(clippy::too_many_arguments)]
pub async fn list_productions(
    pool: &PgPool,
    cursor: Option<&str>,
    limit: Option<i64>,
    tag_id: Option<i32>,
    group_id: Option<i32>,
    search: Option<&str>,
    language: Option<&str>,
    base_url: &str,
) -> Result<ProductionListResponse, AppError> {
    let limit = limit.unwrap_or(DEFAULT_LIMIT).min(100);

    let (cursor_date, cursor_id): (Option<NaiveDateTime>, i32) = if let Some(c) = cursor {
        decode_cursor(c)?
    } else {
        (None, 0)
    };

    // Build query with cursor pagination:
    // ORDER BY earliest_at ASC NULLS LAST, id ASC
    // WHERE (earliest_at > cursor_date) OR (earliest_at = cursor_date AND id > cursor_id) OR (earliest_at IS NULL AND cursor_date IS NULL AND id > cursor_id)
    let prods = if tag_id.is_some() || group_id.is_some() || search.is_some() {
        build_filtered_query(pool, cursor_date, cursor_id, limit + 1, tag_id, group_id, search).await?
    } else {
        build_base_query(pool, cursor_date, cursor_id, limit + 1).await?
    };

    let has_more = prods.len() as i64 > limit;
    let prods = if has_more {
        prods.into_iter().take(limit as usize).collect::<Vec<_>>()
    } else {
        prods
    };

    let next_cursor = if has_more {
        prods.last().map(|p| encode_cursor(p.earliest_at, p.id))
    } else {
        None
    };

    let count = prods.len();
    let mut items = Vec::with_capacity(count);
    for prod in prods {
        items.push(build_production_response(pool, prod, language, base_url).await?);
    }

    Ok(ProductionListResponse {
        items,
        next_cursor,
        count,
    })
}

async fn build_base_query(
    pool: &PgPool,
    cursor_date: Option<NaiveDateTime>,
    cursor_id: i32,
    limit: i64,
) -> Result<Vec<Production>, AppError> {
    sqlx::query_as::<_, Production>(
        r#"
        SELECT * FROM productions
        WHERE
            CASE
                WHEN $1::TIMESTAMP IS NULL THEN
                    (earliest_at IS NULL AND id > $2) OR earliest_at IS NOT NULL
                ELSE
                    earliest_at > $1
                    OR (earliest_at = $1 AND id > $2)
            END
        ORDER BY earliest_at ASC NULLS LAST, id ASC
        LIMIT $3
        "#,
    )
    .bind(cursor_date)
    .bind(cursor_id)
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}

async fn build_filtered_query(
    pool: &PgPool,
    cursor_date: Option<NaiveDateTime>,
    cursor_id: i32,
    limit: i64,
    tag_id: Option<i32>,
    group_id: Option<i32>,
    search: Option<&str>,
) -> Result<Vec<Production>, AppError> {
    let search_pattern = search.map(|s| format!("%{}%", s.to_lowercase()));
    sqlx::query_as::<_, Production>(
        r#"
        SELECT DISTINCT p.* FROM productions p
        LEFT JOIN prod_tags pt ON pt.production_id = p.id
        LEFT JOIN prod_groups pg ON pg.production_id = p.id
        LEFT JOIN prod_info pi ON pi.production_id = p.id
        WHERE
            ($4::INT IS NULL OR pt.tag_id = $4)
            AND ($5::INT IS NULL OR pg.group_id = $5)
            AND ($6::TEXT IS NULL OR LOWER(COALESCE(pi.title, '')) LIKE $6 OR LOWER(COALESCE(pi.artist, '')) LIKE $6)
            AND (
                CASE
                    WHEN $1::TIMESTAMP IS NULL THEN
                        (p.earliest_at IS NULL AND p.id > $2) OR p.earliest_at IS NOT NULL
                    ELSE
                        p.earliest_at > $1
                        OR (p.earliest_at = $1 AND p.id > $2)
                END
            )
        ORDER BY p.earliest_at ASC NULLS LAST, p.id ASC
        LIMIT $3
        "#,
    )
    .bind(cursor_date)
    .bind(cursor_id)
    .bind(limit)
    .bind(tag_id)
    .bind(group_id)
    .bind(search_pattern)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn get_production(
    pool: &PgPool,
    id: i32,
    language: Option<&str>,
    base_url: &str,
) -> Result<ProductionResponse, AppError> {
    let prod = sqlx::query_as::<_, Production>("SELECT * FROM productions WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                AppError::NotFound("Production".to_string(), id.to_string())
            }
            e => AppError::Database(e),
        })?;
    build_production_response(pool, prod, language, base_url).await
}

pub async fn create_production(
    pool: &PgPool,
    data: ProductionCreate,
    base_url: &str,
) -> Result<ProductionResponse, AppError> {
    let prod = sqlx::query_as::<_, Production>(
        r#"
        INSERT INTO productions (viernulvier_id, performer_type, attendance_mode)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(data.viernulvier_id)
    .bind(&data.performer_type)
    .bind(&data.attendance_mode)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    upsert_prod_info(pool, prod.id, "nl", &data.title_nl, &data.supertitle_nl, &data.artist_nl, &data.tagline_nl, &data.teaser_nl, &data.description_nl, &data.info_nl).await?;
    upsert_prod_info(pool, prod.id, "en", &data.title_en, &data.supertitle_en, &data.artist_en, &data.tagline_en, &data.teaser_en, &data.description_en, &data.info_en).await?;

    build_production_response(pool, prod, None, base_url).await
}

pub async fn update_production(
    pool: &PgPool,
    id: i32,
    data: ProductionUpdate,
    base_url: &str,
) -> Result<ProductionResponse, AppError> {
    let prod = sqlx::query_as::<_, Production>(
        r#"
        UPDATE productions
        SET
            viernulvier_id = COALESCE($2, viernulvier_id),
            performer_type = COALESCE($3, performer_type),
            attendance_mode = COALESCE($4, attendance_mode),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(data.viernulvier_id)
    .bind(&data.performer_type)
    .bind(&data.attendance_mode)
    .fetch_one(pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => {
            AppError::NotFound("Production".to_string(), id.to_string())
        }
        e => AppError::Database(e),
    })?;

    if data.title_nl.is_some() || data.supertitle_nl.is_some() || data.artist_nl.is_some() || data.tagline_nl.is_some() || data.teaser_nl.is_some() || data.description_nl.is_some() || data.info_nl.is_some() {
        upsert_prod_info(pool, id, "nl", &data.title_nl, &data.supertitle_nl, &data.artist_nl, &data.tagline_nl, &data.teaser_nl, &data.description_nl, &data.info_nl).await?;
    }
    if data.title_en.is_some() || data.supertitle_en.is_some() || data.artist_en.is_some() || data.tagline_en.is_some() || data.teaser_en.is_some() || data.description_en.is_some() || data.info_en.is_some() {
        upsert_prod_info(pool, id, "en", &data.title_en, &data.supertitle_en, &data.artist_en, &data.tagline_en, &data.teaser_en, &data.description_en, &data.info_en).await?;
    }

    build_production_response(pool, prod, None, base_url).await
}

pub async fn delete_production(pool: &PgPool, id: i32) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM productions WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Production".to_string(), id.to_string()));
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn upsert_prod_info(
    pool: &PgPool,
    production_id: i32,
    language: &str,
    title: &Option<String>,
    supertitle: &Option<String>,
    artist: &Option<String>,
    tagline: &Option<String>,
    teaser: &Option<String>,
    description: &Option<String>,
    info: &Option<String>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO prod_info (production_id, language, title, supertitle, artist, tagline, teaser, description, info)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (production_id, language) DO UPDATE SET
            title = COALESCE(EXCLUDED.title, prod_info.title),
            supertitle = COALESCE(EXCLUDED.supertitle, prod_info.supertitle),
            artist = COALESCE(EXCLUDED.artist, prod_info.artist),
            tagline = COALESCE(EXCLUDED.tagline, prod_info.tagline),
            teaser = COALESCE(EXCLUDED.teaser, prod_info.teaser),
            description = COALESCE(EXCLUDED.description, prod_info.description),
            info = COALESCE(EXCLUDED.info, prod_info.info)
        "#,
    )
    .bind(production_id)
    .bind(language)
    .bind(title)
    .bind(supertitle)
    .bind(artist)
    .bind(tagline)
    .bind(teaser)
    .bind(description)
    .bind(info)
    .execute(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}
