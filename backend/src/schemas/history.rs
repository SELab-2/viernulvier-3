use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Clone)]
pub struct HistoryResponse {
    pub year: i32,
    pub language: String,
    pub title: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HistoryCreate {
    pub year: i32,
    pub language: String,
    pub title: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HistoryListQuery {
    pub language: Option<String>,
}
