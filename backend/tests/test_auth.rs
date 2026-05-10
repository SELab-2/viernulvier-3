mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, seed_admin_user, TestApp};

#[tokio::test]
async fn test_login_success() {
    let app = TestApp::new().await;
    seed_admin_user(&app.db, &app.settings).await;

    let resp = app
        .post_json(
            "/api/v1/auth/login",
            json!({"username": "admin", "password": "admin123"}),
        )
        .await;

    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert!(body["access_token"].as_str().is_some());
    assert!(body["refresh_token"].as_str().is_some());
    assert_eq!(body["token_type"], "bearer");
}

#[tokio::test]
async fn test_login_wrong_password() {
    let app = TestApp::new().await;
    seed_admin_user(&app.db, &app.settings).await;

    let resp = app
        .post_json(
            "/api/v1/auth/login",
            json!({"username": "admin", "password": "wrong"}),
        )
        .await;

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_login_nonexistent_user() {
    let app = TestApp::new().await;

    let resp = app
        .post_json(
            "/api/v1/auth/login",
            json!({"username": "nobody", "password": "pass"}),
        )
        .await;

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_refresh_token() {
    let app = TestApp::new().await;
    seed_admin_user(&app.db, &app.settings).await;

    let login = app
        .post_json(
            "/api/v1/auth/login",
            json!({"username": "admin", "password": "admin123"}),
        )
        .await;
    let login_body = body_json(login).await;
    let refresh_token = login_body["refresh_token"].as_str().unwrap();

    let resp = app
        .post_json(
            "/api/v1/auth/refresh",
            json!({"refresh_token": refresh_token}),
        )
        .await;

    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert!(body["access_token"].as_str().is_some());
}

#[tokio::test]
async fn test_access_token_rejected_for_refresh() {
    let app = TestApp::new().await;
    seed_admin_user(&app.db, &app.settings).await;

    let login = app
        .post_json(
            "/api/v1/auth/login",
            json!({"username": "admin", "password": "admin123"}),
        )
        .await;
    let login_body = body_json(login).await;
    let access_token = login_body["access_token"].as_str().unwrap();

    let resp = app
        .post_json(
            "/api/v1/auth/refresh",
            json!({"refresh_token": access_token}),
        )
        .await;

    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}
