use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::blog::{Blog, BlogContent};
use crate::schemas::blog::{
    BlogContentResponse, BlogCreate, BlogListQuery, BlogListResponse, BlogResponse, BlogUpdate,
};

use super::media::get_media_for_blog;

async fn get_blog_content(
    pool: &PgPool,
    blog_id: i32,
    language: Option<&str>,
) -> Result<Option<BlogContentResponse>, AppError> {
    let lang = language.unwrap_or("nl");
    let content = sqlx::query_as::<_, BlogContent>(
        "SELECT * FROM blog_content WHERE blog_id = $1 AND language = $2",
    )
    .bind(blog_id)
    .bind(lang)
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)?;

    Ok(content.map(|c| BlogContentResponse {
        blog_id: c.blog_id,
        language: c.language,
        title: c.title,
        content: c.content,
    }))
}

async fn build_blog_response(
    pool: &PgPool,
    blog: Blog,
    language: Option<&str>,
    base_url: &str,
) -> Result<BlogResponse, AppError> {
    let content = get_blog_content(pool, blog.id, language).await?;
    let media = get_media_for_blog(pool, blog.id, base_url).await?;
    Ok(BlogResponse {
        id: blog.id,
        content,
        media,
    })
}

pub async fn list_blogs(
    pool: &PgPool,
    query: BlogListQuery,
    language: Option<&str>,
    base_url: &str,
) -> Result<BlogListResponse, AppError> {
    let limit = query.limit.unwrap_or(20).min(100);
    let cursor_id = query.cursor.unwrap_or(0);

    let blogs = sqlx::query_as::<_, Blog>(
        "SELECT * FROM blogs WHERE id > $1 ORDER BY id ASC LIMIT $2",
    )
    .bind(cursor_id)
    .bind(limit + 1)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;

    let has_more = blogs.len() as i64 > limit;
    let blogs: Vec<Blog> = blogs.into_iter().take(limit as usize).collect();

    let next_cursor = if has_more {
        blogs.last().map(|b| b.id)
    } else {
        None
    };

    let count = blogs.len();
    let mut items = Vec::with_capacity(count);
    for blog in blogs {
        items.push(build_blog_response(pool, blog, language, base_url).await?);
    }

    Ok(BlogListResponse {
        items,
        next_cursor,
        count,
    })
}

pub async fn get_blog(
    pool: &PgPool,
    id: i32,
    language: Option<&str>,
    base_url: &str,
) -> Result<BlogResponse, AppError> {
    let blog = sqlx::query_as::<_, Blog>("SELECT * FROM blogs WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("Blog".to_string(), id.to_string()),
            e => AppError::Database(e),
        })?;
    build_blog_response(pool, blog, language, base_url).await
}

pub async fn create_blog(
    pool: &PgPool,
    data: BlogCreate,
    base_url: &str,
) -> Result<BlogResponse, AppError> {
    let blog = sqlx::query_as::<_, Blog>("INSERT INTO blogs DEFAULT VALUES RETURNING *")
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;

    upsert_blog_content(pool, blog.id, "nl", &data.title_nl, &data.content_nl).await?;
    upsert_blog_content(pool, blog.id, "en", &data.title_en, &data.content_en).await?;

    build_blog_response(pool, blog, None, base_url).await
}

pub async fn update_blog(
    pool: &PgPool,
    id: i32,
    data: BlogUpdate,
    base_url: &str,
) -> Result<BlogResponse, AppError> {
    let blog = sqlx::query_as::<_, Blog>("SELECT * FROM blogs WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("Blog".to_string(), id.to_string()),
            e => AppError::Database(e),
        })?;

    if data.title_nl.is_some() || data.content_nl.is_some() {
        upsert_blog_content(pool, id, "nl", &data.title_nl, &data.content_nl).await?;
    }
    if data.title_en.is_some() || data.content_en.is_some() {
        upsert_blog_content(pool, id, "en", &data.title_en, &data.content_en).await?;
    }

    build_blog_response(pool, blog, None, base_url).await
}

pub async fn delete_blog(pool: &PgPool, id: i32) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM blogs WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Blog".to_string(), id.to_string()));
    }
    Ok(())
}

async fn upsert_blog_content(
    pool: &PgPool,
    blog_id: i32,
    language: &str,
    title: &Option<String>,
    content: &Option<String>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO blog_content (blog_id, language, title, content)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (blog_id, language) DO UPDATE SET
            title = COALESCE(EXCLUDED.title, blog_content.title),
            content = COALESCE(EXCLUDED.content, blog_content.content)
        "#,
    )
    .bind(blog_id)
    .bind(language)
    .bind(title)
    .bind(content)
    .execute(pool)
    .await
    .map_err(AppError::Database)?;
    Ok(())
}
