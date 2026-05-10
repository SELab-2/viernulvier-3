mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_list_roles_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/auth/roles").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_create_role() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let resp = app
        .post_json_auth(
            "/api/v1/auth/roles",
            json!({"name": "editor"}),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    assert_eq!(body["name"], "editor");
    assert_eq!(body["permissions"].as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn test_create_permission() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let resp = app
        .post_json_auth(
            "/api/v1/auth/permissions",
            json!({"name": "custom:read"}),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    assert_eq!(body["name"], "custom:read");
}

#[tokio::test]
async fn test_assign_permission_to_role() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let role_resp = app
        .post_json_auth("/api/v1/auth/roles", json!({"name": "viewer"}), &token)
        .await;
    let role_id = body_json(role_resp).await["id"].as_i64().unwrap();

    let perm_resp = app
        .post_json_auth(
            "/api/v1/auth/permissions",
            json!({"name": "archive:read"}),
            &token,
        )
        .await;
    let perm_id = body_json(perm_resp).await["id"].as_i64().unwrap();

    let assign_resp = app
        .post_json_auth(
            &format!("/api/v1/auth/roles/{}/permissions", role_id),
            json!({"permission_id": perm_id}),
            &token,
        )
        .await;
    assert_eq!(assign_resp.status(), StatusCode::NO_CONTENT);

    let role_detail = app
        .get_auth(&format!("/api/v1/auth/roles/{}", role_id), &token)
        .await;
    let role_body = body_json(role_detail).await;
    assert_eq!(role_body["permissions"].as_array().unwrap().len(), 1);
}

#[tokio::test]
async fn test_assign_role_to_user() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let user_resp = app
        .post_json_auth(
            "/api/v1/auth/users",
            json!({"username": "testuser", "password": "pass"}),
            &token,
        )
        .await;
    let user_id = body_json(user_resp).await["id"].as_i64().unwrap();

    let role_resp = app
        .post_json_auth("/api/v1/auth/roles", json!({"name": "member"}), &token)
        .await;
    let role_id = body_json(role_resp).await["id"].as_i64().unwrap();

    let assign_resp = app
        .post_json_auth(
            &format!("/api/v1/auth/users/{}/roles", user_id),
            json!({"role_id": role_id}),
            &token,
        )
        .await;
    assert_eq!(assign_resp.status(), StatusCode::NO_CONTENT);

    let user_detail = app
        .get_auth(&format!("/api/v1/auth/users/{}", user_id), &token)
        .await;
    let user_body = body_json(user_detail).await;
    assert_eq!(user_body["roles"].as_array().unwrap().len(), 1);
}
