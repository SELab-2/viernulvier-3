mod common;

use axum::http::StatusCode;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_health_returns_ok() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/health").await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
}
