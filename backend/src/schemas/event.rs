use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Clone)]
pub struct EventPriceResponse {
    pub id: i32,
    pub viernulvier_id: Option<i32>,
    pub event_id: i32,
    pub amount: Option<f64>,
    pub available: Option<bool>,
    pub expires_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Clone)]
pub struct EventResponse {
    pub id: i32,
    pub viernulvier_id: Option<i32>,
    pub production_id: i32,
    pub hall_id: Option<i32>,
    pub starts_at: Option<NaiveDateTime>,
    pub ends_at: Option<NaiveDateTime>,
    pub order_url: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub prices: Vec<EventPriceResponse>,
}

#[derive(Debug, Deserialize)]
pub struct EventCreate {
    pub production_id: i32,
    pub hall_id: Option<i32>,
    pub starts_at: Option<NaiveDateTime>,
    pub ends_at: Option<NaiveDateTime>,
    pub order_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct EventListQuery {
    pub production_id: Option<i32>,
    pub cursor: Option<i32>,
    pub limit: Option<i64>,
}
