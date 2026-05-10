mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_list_halls_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/archive/halls").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_create_and_list_halls() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let create_resp = app
        .post_json_auth(
            "/api/v1/archive/halls",
            json!({"name": "Grote Zaal", "address": "Markt 1, Gent"}),
            &token,
        )
        .await;
    assert_eq!(create_resp.status(), StatusCode::CREATED);
    let body = body_json(create_resp).await;
    assert_eq!(body["name"], "Grote Zaal");

    let list_resp = app.get_auth("/api/v1/archive/halls", &token).await;
    assert_eq!(list_resp.status(), StatusCode::OK);
    let list_body = body_json(list_resp).await;
    assert_eq!(list_body.as_array().unwrap().len(), 1);
}
