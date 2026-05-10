use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Clone)]
pub struct HallResponse {
    pub id: i32,
    pub address: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HallCreate {
    pub address: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HallListQuery {
    pub cursor: Option<i32>,
    pub limit: Option<i64>,
}
