mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_list_history_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/archive/history").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_create_and_list_history() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let create_resp = app
        .post_json_auth(
            "/api/v1/archive/history",
            json!({"year": 2023, "language": "nl", "title": "2023", "content": "Geweldig jaar"}),
            &token,
        )
        .await;
    assert_eq!(create_resp.status(), StatusCode::CREATED);

    let list_resp = app.get_auth("/api/v1/archive/history", &token).await;
    assert_eq!(list_resp.status(), StatusCode::OK);
    let body = body_json(list_resp).await;
    let items = body.as_array().unwrap();
    assert!(!items.is_empty());
    assert_eq!(items[0]["year"], 2023);
}

#[tokio::test]
async fn test_list_history_filtered_by_language() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    app.post_json_auth(
        "/api/v1/archive/history",
        json!({"year": 2022, "language": "nl", "title": "NL"}),
        &token,
    )
    .await;
    app.post_json_auth(
        "/api/v1/archive/history",
        json!({"year": 2022, "language": "en", "title": "EN"}),
        &token,
    )
    .await;

    let resp = app
        .get_auth("/api/v1/archive/history?language=nl", &token)
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let items = body.as_array().unwrap();
    assert!(items.iter().all(|i| i["language"] == "nl"));
}
