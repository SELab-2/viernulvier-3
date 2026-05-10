use serde::{Deserialize, Serialize};

use super::media::MediaResponse;

#[derive(Debug, Serialize, Clone)]
pub struct BlogContentResponse {
    pub blog_id: i32,
    pub language: String,
    pub title: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BlogResponse {
    pub id: i32,
    pub content: Option<BlogContentResponse>,
    pub media: Vec<MediaResponse>,
}

#[derive(Debug, Serialize)]
pub struct BlogListResponse {
    pub items: Vec<BlogResponse>,
    pub next_cursor: Option<i32>,
    pub count: usize,
}

#[derive(Debug, Deserialize)]
pub struct BlogCreate {
    pub title_nl: Option<String>,
    pub content_nl: Option<String>,
    pub title_en: Option<String>,
    pub content_en: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BlogUpdate {
    pub title_nl: Option<String>,
    pub content_nl: Option<String>,
    pub title_en: Option<String>,
    pub content_en: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BlogListQuery {
    pub cursor: Option<i32>,
    pub limit: Option<i64>,
}
