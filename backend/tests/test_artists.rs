mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_list_artists_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/archive/artists").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_list_artists_empty() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;
    let resp = app.get_auth("/api/v1/archive/artists", &token).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["count"], 0);
}

#[tokio::test]
async fn test_list_artists_with_data() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    app.post_json_auth(
        "/api/v1/archive/productions",
        json!({"artist_nl": "Jan Fabre", "artist_en": "Jan Fabre"}),
        &token,
    )
    .await;
    app.post_json_auth(
        "/api/v1/archive/productions",
        json!({"artist_nl": "Tg STAN", "artist_en": "Tg STAN"}),
        &token,
    )
    .await;

    let resp = app
        .get_auth_lang("/api/v1/archive/artists", &token, "nl")
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["count"], 2);
}
