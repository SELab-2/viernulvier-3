use chrono::NaiveDateTime;
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct MediaResponse {
    pub id: i32,
    pub vnv_item_id: Option<i32>,
    pub production_id: Option<i32>,
    pub blog_id: Option<i32>,
    pub object_key: String,
    pub content_type: String,
    pub uploaded_at: Option<NaiveDateTime>,
    pub url: String,
}
