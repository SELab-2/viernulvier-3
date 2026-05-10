use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct Permission {
    pub id: i32,
    pub name: String,
}
