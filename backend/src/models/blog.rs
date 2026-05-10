use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct Blog {
    pub id: i32,
}

#[derive(Debug, Clone, FromRow)]
pub struct BlogContent {
    pub blog_id: i32,
    pub language: String,
    pub title: Option<String>,
    pub content: Option<String>,
}
