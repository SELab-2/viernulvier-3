use chrono::NaiveDateTime;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct Media {
    pub id: i32,
    pub vnv_item_id: Option<i32>,
    pub production_id: Option<i32>,
    pub blog_id: Option<i32>,
    pub object_key: String,
    pub content_type: String,
    pub uploaded_at: Option<NaiveDateTime>,
}
