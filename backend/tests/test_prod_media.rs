mod common;

use axum::http::StatusCode;

use common::TestApp;

#[tokio::test]
async fn test_upload_production_media_nonexistent_production() {
    let app = TestApp::new().await;
    let token = app.get_admin_token().await;

    // Use a multipart body (empty/malformed) — should get 404 for nonexistent production
    let boundary = "boundary1234";
    let body = format!(
        "--{}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test.jpg\"\r\nContent-Type: image/jpeg\r\n\r\nfakedata\r\n--{}--\r\n",
        boundary, boundary
    );

    let resp = app
        .request(
            axum::http::Request::builder()
                .method("POST")
                .uri("/api/v1/archive/productions/99999/media")
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
