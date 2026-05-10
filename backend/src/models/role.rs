use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct Role {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone, FromRow)]
pub struct RolePermission {
    pub role_id: i32,
    pub permission_id: i32,
}
