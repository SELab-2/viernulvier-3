mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, seed_admin_user, TestApp};

#[tokio::test]
async fn test_list_users_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/auth/users").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_list_users_as_admin() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let resp = app.get_auth("/api/v1/auth/users", &token).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let users = body.as_array().unwrap();
    assert!(!users.is_empty());
    assert!(users.iter().any(|u| u["username"] == "admin"));
}

#[tokio::test]
async fn test_create_user() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let resp = app
        .post_json_auth(
            "/api/v1/auth/users",
            json!({"username": "newuser", "password": "securepass"}),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    assert_eq!(body["username"], "newuser");
    assert_eq!(body["super_user"], false);
}

#[tokio::test]
async fn test_create_user_duplicate_username() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    app.post_json_auth(
        "/api/v1/auth/users",
        json!({"username": "dupuser", "password": "pass"}),
        &token,
    )
    .await;

    let resp = app
        .post_json_auth(
            "/api/v1/auth/users",
            json!({"username": "dupuser", "password": "pass2"}),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::CONFLICT);
}

#[tokio::test]
async fn test_get_own_user() {
    let app = TestApp::new().await;
    seed_admin_user(&app.db, &app.settings).await;

    let login_resp = app
        .post_json(
            "/api/v1/auth/login",
            json!({"username": "admin", "password": "admin123"}),
        )
        .await;
    let login_body = body_json(login_resp).await;
    let token = login_body["access_token"].as_str().unwrap();

    let users_resp = app.get_auth("/api/v1/auth/users", token).await;
    let users = body_json(users_resp).await;
    let admin_id = users.as_array().unwrap()[0]["id"].as_i64().unwrap();

    let resp = app
        .get_auth(&format!("/api/v1/auth/users/{}", admin_id), token)
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["username"], "admin");
}
