mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_list_productions_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/archive/productions").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_list_productions_empty() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;
    let resp = app.get_auth("/api/v1/archive/productions", &token).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["items"].as_array().unwrap().len(), 0);
    assert_eq!(body["count"], 0);
}

#[tokio::test]
async fn test_create_production() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let resp = app
        .post_json_auth(
            "/api/v1/archive/productions",
            json!({
                "performer_type": "theater",
                "title_nl": "Test Productie",
                "title_en": "Test Production"
            }),
            &token,
        )
        .await;

    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    assert!(body["id"].as_i64().is_some());
    assert_eq!(body["performer_type"], "theater");
}

#[tokio::test]
async fn test_get_production() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let create_resp = app
        .post_json_auth(
            "/api/v1/archive/productions",
            json!({"performer_type": "dance"}),
            &token,
        )
        .await;
    let create_body = body_json(create_resp).await;
    let id = create_body["id"].as_i64().unwrap();

    let resp = app
        .get_auth(&format!("/api/v1/archive/productions/{}", id), &token)
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["id"], id);
}

#[tokio::test]
async fn test_get_production_not_found() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;
    let resp = app
        .get_auth("/api/v1/archive/productions/99999", &token)
        .await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_update_production() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let create_resp = app
        .post_json_auth(
            "/api/v1/archive/productions",
            json!({"performer_type": "music"}),
            &token,
        )
        .await;
    let create_body = body_json(create_resp).await;
    let id = create_body["id"].as_i64().unwrap();

    let resp = app
        .patch_json_auth(
            &format!("/api/v1/archive/productions/{}", id),
            json!({"performer_type": "theater"}),
            &token,
        )
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["performer_type"], "theater");
}

#[tokio::test]
async fn test_delete_production() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let create_resp = app
        .post_json_auth(
            "/api/v1/archive/productions",
            json!({"performer_type": "music"}),
            &token,
        )
        .await;
    let create_body = body_json(create_resp).await;
    let id = create_body["id"].as_i64().unwrap();

    let del_resp = app
        .delete_auth(&format!("/api/v1/archive/productions/{}", id), &token)
        .await;
    assert_eq!(del_resp.status(), StatusCode::NO_CONTENT);

    let get_resp = app
        .get_auth(&format!("/api/v1/archive/productions/{}", id), &token)
        .await;
    assert_eq!(get_resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_list_productions_with_language() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    app.post_json_auth(
        "/api/v1/archive/productions",
        json!({"title_nl": "Nederlandse Titel", "title_en": "English Title"}),
        &token,
    )
    .await;

    let resp = app
        .get_auth_lang("/api/v1/archive/productions", &token, "nl")
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let items = body["items"].as_array().unwrap();
    assert!(!items.is_empty());
    assert_eq!(items[0]["info"]["title"], "Nederlandse Titel");
}

#[tokio::test]
async fn test_list_productions_cursor_pagination() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    for i in 0..5 {
        app.post_json_auth(
            "/api/v1/archive/productions",
            json!({"performer_type": format!("type_{}", i)}),
            &token,
        )
        .await;
    }

    let resp1 = app
        .get_auth("/api/v1/archive/productions?limit=3", &token)
        .await;
    assert_eq!(resp1.status(), StatusCode::OK);
    let body1 = body_json(resp1).await;
    assert_eq!(body1["items"].as_array().unwrap().len(), 3);
    let cursor = body1["next_cursor"].as_str().unwrap();

    let resp2 = app
        .get_auth(
            &format!("/api/v1/archive/productions?limit=3&cursor={}", cursor),
            &token,
        )
        .await;
    assert_eq!(resp2.status(), StatusCode::OK);
    let body2 = body_json(resp2).await;
    assert_eq!(body2["items"].as_array().unwrap().len(), 2);
    assert!(body2["next_cursor"].is_null());
}
