mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_create_and_list_production_groups() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let resp = app
        .post_json_auth(
            "/api/v1/archive/production-groups",
            json!({"title": "Opera", "is_public_filter": true}),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    assert_eq!(body["title"], "Opera");
    assert_eq!(body["is_public_filter"], true);

    let list_resp = app
        .get_auth("/api/v1/archive/production-groups", &token)
        .await;
    assert_eq!(list_resp.status(), StatusCode::OK);
    let list = body_json(list_resp).await;
    assert_eq!(list.as_array().unwrap().len(), 1);
}
