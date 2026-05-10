use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct Hall {
    pub id: i32,
    pub address: Option<String>,
    pub name: Option<String>,
}
