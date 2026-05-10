use aws_sdk_s3::Client as S3Client;
use axum::extract::Multipart;
use sqlx::PgPool;
use std::sync::Arc;

use crate::config::Settings;
use crate::errors::AppError;
use crate::models::media::Media;
use crate::schemas::media::MediaResponse;

fn to_response(m: Media, base_url: &str) -> MediaResponse {
    let url = get_media_url_from_key(base_url, &m.object_key);
    MediaResponse {
        id: m.id,
        vnv_item_id: m.vnv_item_id,
        production_id: m.production_id,
        blog_id: m.blog_id,
        object_key: m.object_key,
        content_type: m.content_type,
        uploaded_at: m.uploaded_at,
        url,
    }
}

fn get_media_url_from_key(base_url: &str, object_key: &str) -> String {
    format!("{}/{}", base_url.trim_end_matches('/'), object_key)
}

pub async fn get_media_for_production(
    pool: &PgPool,
    production_id: i32,
    base_url: &str,
) -> Result<Vec<MediaResponse>, AppError> {
    sqlx::query_as::<_, Media>(
        "SELECT * FROM media WHERE production_id = $1 ORDER BY id",
    )
    .bind(production_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
    .map(|rows| rows.into_iter().map(|m| to_response(m, base_url)).collect())
}

pub async fn get_media_for_blog(
    pool: &PgPool,
    blog_id: i32,
    base_url: &str,
) -> Result<Vec<MediaResponse>, AppError> {
    sqlx::query_as::<_, Media>(
        "SELECT * FROM media WHERE blog_id = $1 ORDER BY id",
    )
    .bind(blog_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
    .map(|rows| rows.into_iter().map(|m| to_response(m, base_url)).collect())
}

pub async fn upload_production_media(
    pool: &PgPool,
    s3: Arc<S3Client>,
    settings: Arc<Settings>,
    production_id: i32,
    mut multipart: Multipart,
) -> Result<MediaResponse, AppError> {
    // Verify production exists
    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM productions WHERE id = $1)")
        .bind(production_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;
    if !exists {
        return Err(AppError::NotFound(
            "Production".to_string(),
            production_id.to_string(),
        ));
    }

    let (object_key, content_type, data) = extract_file_from_multipart(&mut multipart).await?;

    s3.put_object()
        .bucket(&settings.minio_bucket)
        .key(&object_key)
        .content_type(&content_type)
        .body(data.into())
        .send()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let media = sqlx::query_as::<_, Media>(
        r#"
        INSERT INTO media (production_id, object_key, content_type)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(production_id)
    .bind(&object_key)
    .bind(&content_type)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    let base_url = format!(
        "{}/{}",
        settings.minio_endpoint.trim_end_matches('/'),
        settings.minio_bucket
    );
    Ok(to_response(media, &base_url))
}

pub async fn upload_blog_media(
    pool: &PgPool,
    s3: Arc<S3Client>,
    settings: Arc<Settings>,
    blog_id: i32,
    mut multipart: Multipart,
) -> Result<MediaResponse, AppError> {
    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM blogs WHERE id = $1)")
        .bind(blog_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::Database)?;
    if !exists {
        return Err(AppError::NotFound("Blog".to_string(), blog_id.to_string()));
    }

    let (object_key, content_type, data) = extract_file_from_multipart(&mut multipart).await?;

    s3.put_object()
        .bucket(&settings.minio_bucket)
        .key(&object_key)
        .content_type(&content_type)
        .body(data.into())
        .send()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let media = sqlx::query_as::<_, Media>(
        r#"
        INSERT INTO media (blog_id, object_key, content_type)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(blog_id)
    .bind(&object_key)
    .bind(&content_type)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    let base_url = format!(
        "{}/{}",
        settings.minio_endpoint.trim_end_matches('/'),
        settings.minio_bucket
    );
    Ok(to_response(media, &base_url))
}

pub async fn delete_media(
    pool: &PgPool,
    s3: Arc<S3Client>,
    settings: Arc<Settings>,
    media_id: i32,
) -> Result<(), AppError> {
    let media = sqlx::query_as::<_, Media>("SELECT * FROM media WHERE id = $1")
        .bind(media_id)
        .fetch_one(pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound("Media".to_string(), media_id.to_string()),
            e => AppError::Database(e),
        })?;

    s3.delete_object()
        .bucket(&settings.minio_bucket)
        .key(&media.object_key)
        .send()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    sqlx::query("DELETE FROM media WHERE id = $1")
        .bind(media_id)
        .execute(pool)
        .await
        .map_err(AppError::Database)?;

    Ok(())
}

async fn extract_file_from_multipart(
    multipart: &mut Multipart,
) -> Result<(String, String, bytes::Bytes), AppError> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();
        if name != "file" {
            continue;
        }

        let filename = field
            .file_name()
            .unwrap_or("upload")
            .to_string();

        let content_type = field
            .content_type()
            .unwrap_or("application/octet-stream")
            .to_string();

        let allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];
        if !allowed.contains(&content_type.as_str()) {
            return Err(AppError::UnsupportedMediaType(format!(
                "Content type '{}' is not supported",
                content_type
            )));
        }

        let data = field
            .bytes()
            .await
            .map_err(|e| AppError::BadRequest(e.to_string()))?;

        let object_key = format!(
            "{}-{}",
            uuid::Uuid::new_v4(),
            filename
        );

        return Ok((object_key, content_type, data));
    }

    Err(AppError::BadRequest("No file field found in multipart".to_string()))
}
