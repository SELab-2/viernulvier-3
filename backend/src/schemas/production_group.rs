use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Clone)]
pub struct ProductionGroupResponse {
    pub id: i32,
    pub title: Option<String>,
    pub is_public_filter: bool,
}

#[derive(Debug, Deserialize)]
pub struct ProductionGroupCreate {
    pub title: Option<String>,
    pub is_public_filter: bool,
}

#[derive(Debug, Deserialize)]
pub struct ProductionGroupListQuery {
    pub cursor: Option<i32>,
    pub limit: Option<i64>,
}
