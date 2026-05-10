pub mod login;
pub mod permissions;
pub mod roles;
pub mod users;

use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::AppState;

use login::{login_handler, refresh_handler};
use permissions::{create_permission_handler, list_permissions_handler};
use roles::{
    assign_permission_handler, create_role_handler, get_role_handler, list_roles_handler,
    remove_permission_handler,
};
use users::{
    assign_role_handler, create_user_handler, get_user_handler, list_users_handler,
    remove_role_handler,
};

pub fn auth_router() -> Router<AppState> {
    Router::new()
        .route("/login", post(login_handler))
        .route("/refresh", post(refresh_handler))
        .route("/users", get(list_users_handler).post(create_user_handler))
        .route("/users/{id}", get(get_user_handler))
        .route("/users/{id}/roles", post(assign_role_handler))
        .route("/users/{user_id}/roles/{role_id}", delete(remove_role_handler))
        .route("/roles", get(list_roles_handler).post(create_role_handler))
        .route("/roles/{id}", get(get_role_handler))
        .route("/roles/{id}/permissions", post(assign_permission_handler))
        .route(
            "/roles/{role_id}/permissions/{permission_id}",
            delete(remove_permission_handler),
        )
        .route(
            "/permissions",
            get(list_permissions_handler).post(create_permission_handler),
        )
}
