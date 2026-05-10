#![allow(dead_code)]

use std::sync::Arc;

use aws_credential_types::Credentials;
use aws_sdk_s3::config::Region;
use axum::Router;
use axum::body::Body;
use axum::http::{Request, Response};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;

use viernulvier_backend::api::v1::v1_router;
use viernulvier_backend::config::Settings;
use viernulvier_backend::database::{create_pool, run_migrations};
use viernulvier_backend::AppState;

pub struct TestApp {
    pub router: Router,
    pub db: PgPool,
    pub settings: Arc<Settings>,
}

impl TestApp {
    pub async fn new() -> Self {
        let _ = dotenvy::dotenv();

        let database_url = std::env::var("TEST_DATABASE_URL")
            .expect("TEST_DATABASE_URL must be set for integration tests");

        let pool = create_pool(&database_url)
            .await
            .expect("Failed to connect to test DB");

        run_migrations(&pool).await.expect("Failed to run migrations");
        truncate_all(&pool).await;

        let settings = Arc::new(Settings {
            app_title: "Test".to_string(),
            api_version: "0.1.0".to_string(),
            postgres_user: "test".to_string(),
            postgres_password: "test".to_string(),
            postgres_db: "test".to_string(),
            database_host: "localhost".to_string(),
            database_port: 5432,
            jwt_secret_key: "test-secret-key-12345678901234567890".to_string(),
            jwt_algorithm: "HS256".to_string(),
            access_token_expire_minutes: 60,
            refresh_token_expire_minutes: 1440,
            viernulvier_key: "test-key".to_string(),
            minio_root_user: "minio".to_string(),
            minio_root_password: "minio123".to_string(),
            minio_endpoint: "http://localhost:9000".to_string(),
            minio_bucket: "test-bucket".to_string(),
            default_admin_user: "admin".to_string(),
            default_admin_password: "admin123".to_string(),
        });

        let s3 = Arc::new(build_mock_s3().await);

        let state = AppState {
            db: pool.clone(),
            settings: settings.clone(),
            s3,
        };

        let router = Router::new()
            .nest("/api/v1", v1_router())
            .with_state(state);

        TestApp {
            router,
            db: pool,
            settings,
        }
    }

    pub async fn request(&self, req: Request<Body>) -> Response<Body> {
        self.router.clone().oneshot(req).await.expect("Request failed")
    }

    pub async fn get(&self, uri: &str) -> Response<Body> {
        self.request(
            Request::builder()
                .method("GET")
                .uri(uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
    }

    pub async fn get_auth(&self, uri: &str, token: &str) -> Response<Body> {
        self.request(
            Request::builder()
                .method("GET")
                .uri(uri)
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
    }

    pub async fn get_auth_lang(&self, uri: &str, token: &str, lang: &str) -> Response<Body> {
        self.request(
            Request::builder()
                .method("GET")
                .uri(uri)
                .header("Authorization", format!("Bearer {}", token))
                .header("Accept-Language", lang)
                .body(Body::empty())
                .unwrap(),
        )
        .await
    }

    pub async fn post_json(&self, uri: &str, body: Value) -> Response<Body> {
        self.request(
            Request::builder()
                .method("POST")
                .uri(uri)
                .header("Content-Type", "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
    }

    pub async fn post_json_auth(&self, uri: &str, body: Value, token: &str) -> Response<Body> {
        self.request(
            Request::builder()
                .method("POST")
                .uri(uri)
                .header("Content-Type", "application/json")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
    }

    pub async fn patch_json_auth(&self, uri: &str, body: Value, token: &str) -> Response<Body> {
        self.request(
            Request::builder()
                .method("PATCH")
                .uri(uri)
                .header("Content-Type", "application/json")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
    }

    pub async fn delete_auth(&self, uri: &str, token: &str) -> Response<Body> {
        self.request(
            Request::builder()
                .method("DELETE")
                .uri(uri)
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
    }

    pub async fn get_admin_token(&self) -> String {
        seed_admin_user(&self.db, &self.settings).await;
        let resp = self
            .post_json(
                "/api/v1/auth/login",
                json!({
                    "username": "admin",
                    "password": "admin123"
                }),
            )
            .await;
        let body = body_json(resp).await;
        body["access_token"].as_str().unwrap().to_string()
    }
}

pub async fn seed_admin_user(pool: &PgPool, settings: &Settings) {
    use viernulvier_backend::services::auth::password::hash_password;
    let hashed = hash_password(&settings.default_admin_password).unwrap();
    sqlx::query(
        "INSERT INTO users (username, hashed_password, super_user) VALUES ($1, $2, true) ON CONFLICT (username) DO NOTHING",
    )
    .bind(&settings.default_admin_user)
    .bind(&hashed)
    .execute(pool)
    .await
    .unwrap();
}

pub async fn body_json(resp: Response<Body>) -> Value {
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&bytes).unwrap_or(Value::Null)
}

pub async fn body_bytes(resp: Response<Body>) -> bytes::Bytes {
    resp.into_body().collect().await.unwrap().to_bytes()
}

async fn truncate_all(pool: &PgPool) {
    sqlx::query(
        r#"
        TRUNCATE TABLE
            media, prod_blogs, prod_groups, prod_tags, blog_content, blogs,
            history, sync_state, tag_names, tags, event_prices, events,
            prod_info, productions, production_groups, halls,
            role_permissions, user_roles, permissions, roles, users
        RESTART IDENTITY CASCADE
        "#,
    )
    .execute(pool)
    .await
    .ok();
}

async fn build_mock_s3() -> aws_sdk_s3::Client {
    let creds = Credentials::new("test", "test", None, None, "static");
    let s3_config = aws_sdk_s3::config::Builder::new()
        .behavior_version(aws_sdk_s3::config::BehaviorVersion::latest())
        .credentials_provider(creds)
        .region(Region::new("us-east-1"))
        .endpoint_url("http://localhost:9000")
        .force_path_style(true)
        .build();
    aws_sdk_s3::Client::from_conf(s3_config)
}
