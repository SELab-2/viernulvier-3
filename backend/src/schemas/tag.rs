use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Clone)]
pub struct TagNameResponse {
    pub tag_id: i32,
    pub language: String,
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct TagResponse {
    pub id: i32,
    pub viernulvier_id: Option<i32>,
    pub names: Vec<TagNameResponse>,
}

#[derive(Debug, Deserialize)]
pub struct TagNameCreate {
    pub language: String,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct TagCreate {
    pub viernulvier_id: Option<i32>,
    pub names: Vec<TagNameCreate>,
}

#[derive(Debug, Deserialize)]
pub struct TagListQuery {
    pub cursor: Option<i32>,
    pub limit: Option<i64>,
}
