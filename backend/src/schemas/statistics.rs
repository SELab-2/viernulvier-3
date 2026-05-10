use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct StatisticsResponse {
    pub productions_count: i64,
    pub events_count: i64,
    pub blogs_count: i64,
}
