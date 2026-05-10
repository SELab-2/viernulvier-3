use crate::config::Settings;

pub fn get_media_url(settings: &Settings, object_key: &str) -> String {
    format!(
        "{}/{}/{}",
        settings.minio_endpoint.trim_end_matches('/'),
        settings.minio_bucket,
        object_key
    )
}
