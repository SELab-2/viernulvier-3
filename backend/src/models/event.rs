use chrono::NaiveDateTime;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct Event {
    pub id: i32,
    pub viernulvier_id: Option<i32>,
    pub production_id: i32,
    pub hall_id: Option<i32>,
    pub starts_at: Option<NaiveDateTime>,
    pub ends_at: Option<NaiveDateTime>,
    pub order_url: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, FromRow)]
pub struct EventPrice {
    pub id: i32,
    pub viernulvier_id: Option<i32>,
    pub event_id: i32,
    pub amount: Option<f64>,
    pub available: Option<bool>,
    pub expires_at: Option<NaiveDateTime>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}
