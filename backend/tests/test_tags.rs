mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_create_and_list_tags() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let resp = app
        .post_json_auth(
            "/api/v1/archive/tags",
            json!({
                "names": [
                    {"language": "nl", "name": "Theater"},
                    {"language": "en", "name": "Theatre"}
                ]
            }),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    assert!(body["id"].as_i64().is_some());
    assert_eq!(body["names"].as_array().unwrap().len(), 2);

    let list_resp = app.get_auth("/api/v1/archive/tags", &token).await;
    assert_eq!(list_resp.status(), StatusCode::OK);
    let list_body = body_json(list_resp).await;
    assert_eq!(list_body.as_array().unwrap().len(), 1);
}

#[tokio::test]
async fn test_list_tags_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/archive/tags").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}
