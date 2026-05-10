mod common;

use axum::http::StatusCode;
use serde_json::json;

use common::{body_json, TestApp};

#[tokio::test]
async fn test_list_blogs_requires_auth() {
    let app = TestApp::new().await;
    let resp = app.get("/api/v1/archive/blogs").await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_create_and_get_blog() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let create_resp = app
        .post_json_auth(
            "/api/v1/archive/blogs",
            json!({
                "title_nl": "Mijn Blog",
                "content_nl": "Inhoud van mijn blog",
                "title_en": "My Blog",
                "content_en": "Content of my blog"
            }),
            &token,
        )
        .await;
    assert_eq!(create_resp.status(), StatusCode::CREATED);
    let create_body = body_json(create_resp).await;
    let id = create_body["id"].as_i64().unwrap();

    let get_resp = app
        .get_auth_lang(&format!("/api/v1/archive/blogs/{}", id), &token, "nl")
        .await;
    assert_eq!(get_resp.status(), StatusCode::OK);
    let get_body = body_json(get_resp).await;
    assert_eq!(get_body["content"]["title"], "Mijn Blog");
}

#[tokio::test]
async fn test_list_blogs_pagination() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    for i in 0..5 {
        app.post_json_auth(
            "/api/v1/archive/blogs",
            json!({"title_nl": format!("Blog {}", i)}),
            &token,
        )
        .await;
    }

    let resp = app
        .get_auth("/api/v1/archive/blogs?limit=3", &token)
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["items"].as_array().unwrap().len(), 3);
    assert!(body["next_cursor"].as_i64().is_some());
}

#[tokio::test]
async fn test_update_blog() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let create_resp = app
        .post_json_auth(
            "/api/v1/archive/blogs",
            json!({"title_nl": "Originele Titel"}),
            &token,
        )
        .await;
    let id = body_json(create_resp).await["id"].as_i64().unwrap();

    let update_resp = app
        .patch_json_auth(
            &format!("/api/v1/archive/blogs/{}", id),
            json!({"title_nl": "Nieuwe Titel"}),
            &token,
        )
        .await;
    assert_eq!(update_resp.status(), StatusCode::OK);

    let get_resp = app
        .get_auth_lang(&format!("/api/v1/archive/blogs/{}", id), &token, "nl")
        .await;
    let body = body_json(get_resp).await;
    assert_eq!(body["content"]["title"], "Nieuwe Titel");
}

#[tokio::test]
async fn test_delete_blog() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let create_resp = app
        .post_json_auth("/api/v1/archive/blogs", json!({}), &token)
        .await;
    let id = body_json(create_resp).await["id"].as_i64().unwrap();

    let del_resp = app
        .delete_auth(&format!("/api/v1/archive/blogs/{}", id), &token)
        .await;
    assert_eq!(del_resp.status(), StatusCode::NO_CONTENT);

    let get_resp = app
        .get_auth(&format!("/api/v1/archive/blogs/{}", id), &token)
        .await;
    assert_eq!(get_resp.status(), StatusCode::NOT_FOUND);
}
