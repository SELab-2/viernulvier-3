mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_statistics_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/archive/statistics").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_statistics_empty_db() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let resp = app.get_auth("/api/v1/archive/statistics", &token).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["productions_count"], 0);
    assert_eq!(body["events_count"], 0);
    assert_eq!(body["blogs_count"], 0);
}

#[tokio::test]
async fn test_statistics_with_data() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    app.post_json_auth("/api/v1/archive/productions", json!({}), &token)
        .await;
    app.post_json_auth("/api/v1/archive/blogs", json!({}), &token)
        .await;

    let resp = app.get_auth("/api/v1/archive/statistics", &token).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["productions_count"], 1);
    assert_eq!(body["blogs_count"], 1);
}
