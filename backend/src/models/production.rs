use chrono::NaiveDateTime;
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct Production {
    pub id: i32,
    pub viernulvier_id: Option<i32>,
    pub performer_type: Option<String>,
    pub attendance_mode: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub earliest_at: Option<NaiveDateTime>,
    pub latest_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ProdInfo {
    pub production_id: i32,
    pub language: String,
    pub title: Option<String>,
    pub supertitle: Option<String>,
    pub artist: Option<String>,
    pub tagline: Option<String>,
    pub teaser: Option<String>,
    pub description: Option<String>,
    pub info: Option<String>,
}
