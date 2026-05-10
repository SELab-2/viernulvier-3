mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

async fn create_test_production(app: &TestApp, token: &str) -> i64 {
    let resp = app
        .post_json_auth(
            "/api/v1/archive/productions",
            json!({"performer_type": "theater"}),
            token,
        )
        .await;
    body_json(resp).await["id"].as_i64().unwrap()
}

#[tokio::test]
async fn test_list_events_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/archive/events").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_list_events_empty() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;
    let resp = app.get_auth("/api/v1/archive/events", &token).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body.as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn test_create_event() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;
    let prod_id = create_test_production(&app, &token).await;

    let resp = app
        .post_json_auth(
            "/api/v1/archive/events",
            json!({
                "production_id": prod_id,
                "order_url": "https://example.com/tickets"
            }),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    assert_eq!(body["production_id"], prod_id);
    assert_eq!(body["order_url"], "https://example.com/tickets");
}

#[tokio::test]
async fn test_list_events_filter_by_production() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;
    let prod1 = create_test_production(&app, &token).await;
    let prod2 = create_test_production(&app, &token).await;

    app.post_json_auth(
        "/api/v1/archive/events",
        json!({"production_id": prod1}),
        &token,
    )
    .await;
    app.post_json_auth(
        "/api/v1/archive/events",
        json!({"production_id": prod2}),
        &token,
    )
    .await;

    let resp = app
        .get_auth(
            &format!("/api/v1/archive/events?production_id={}", prod1),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let items = body.as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["production_id"], prod1);
}
