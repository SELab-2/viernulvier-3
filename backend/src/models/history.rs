use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct History {
    pub year: i32,
    pub language: String,
    pub title: Option<String>,
    pub content: Option<String>,
}
