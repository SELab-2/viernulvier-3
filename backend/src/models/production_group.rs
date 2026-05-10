use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct ProductionGroup {
    pub id: i32,
    pub title: Option<String>,
    pub is_public_filter: bool,
}
