use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct Tag {
    pub id: i32,
    pub viernulvier_id: Option<i32>,
}

#[derive(Debug, Clone, FromRow)]
pub struct TagName {
    pub tag_id: i32,
    pub language: String,
    pub name: String,
}
