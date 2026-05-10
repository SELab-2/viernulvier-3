mod common;

use axum::http::StatusCode;

use common::TestApp;

#[tokio::test]
async fn test_upload_blog_media_nonexistent_blog() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    let boundary = "boundary5678";
    let body = format!(
        "--{}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test.png\"\r\nContent-Type: image/png\r\n\r\nfakedata\r\n--{}--\r\n",
        boundary, boundary
    );

    let resp = app
        .request(
            axum::http::Request::builder()
                .method("POST")
                .uri("/api/v1/archive/blogs/99999/media")
                .header("Authorization", format!("Bearer {}", token))
                .header(
                    "Content-Type",
                    format!("multipart/form-data; boundary={}", boundary),
                )
                .body(axum::body::Body::from(body))
                .unwrap(),
        )
        .await;

    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}
