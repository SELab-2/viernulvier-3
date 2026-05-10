use std::sync::Arc;

use aws_credential_types::Credentials;
use aws_sdk_s3::config::Region;
use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use viernulvier_backend::api::v1::v1_router;
use viernulvier_backend::config::Settings;
use viernulvier_backend::database::{create_pool, run_migrations};
use viernulvier_backend::services::auth::permissions::*;
use viernulvier_backend::services::auth::password::hash_password;
use viernulvier_backend::AppState;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let settings = Arc::new(Settings::from_env());
    let pool = create_pool(&settings.database_url())
        .await
        .expect("Failed to connect to database");

    run_migrations(&pool).await.expect("Failed to run migrations");

    seed_initial_data(&pool, &settings).await;

    let s3 = Arc::new(build_s3_client(&settings).await);
    ensure_bucket(&s3, &settings).await;

    let state = AppState {
        db: pool.clone(),
        settings: settings.clone(),
        s3,
    };

    tokio::spawn(viernulvier_backend::worker::sync_job::run_sync(pool.clone(), settings.clone()));

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .nest("/api/v1", v1_router())
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000")
        .await
        .expect("Failed to bind port 8000");

    tracing::info!("Listening on http://0.0.0.0:8000");
    axum::serve(listener, app).await.expect("Server error");
}

async fn build_s3_client(settings: &Settings) -> aws_sdk_s3::Client {
    let creds = Credentials::new(
        &settings.minio_root_user,
        &settings.minio_root_password,
        None,
        None,
        "static",
    );
    let s3_config = aws_sdk_s3::config::Builder::new()
        .behavior_version(aws_sdk_s3::config::BehaviorVersion::latest())
        .credentials_provider(creds)
        .region(Region::new("us-east-1"))
        .endpoint_url(&settings.minio_endpoint)
        .force_path_style(true)
        .build();
    aws_sdk_s3::Client::from_conf(s3_config)
}

async fn ensure_bucket(s3: &aws_sdk_s3::Client, settings: &Settings) {
    match s3
        .head_bucket()
        .bucket(&settings.minio_bucket)
        .send()
        .await
    {
        Ok(_) => tracing::info!("MinIO bucket '{}' exists", settings.minio_bucket),
        Err(_) => {
            s3.create_bucket()
                .bucket(&settings.minio_bucket)
                .send()
                .await
                .expect("Failed to create MinIO bucket");
            tracing::info!("Created MinIO bucket '{}'", settings.minio_bucket);
        }
    }
}

async fn seed_initial_data(pool: &sqlx::PgPool, settings: &Settings) {
    // Seed permissions
    for perm_name in [
        PERMISSION_ARCHIVE_READ,
        PERMISSION_ARCHIVE_WRITE,
        PERMISSION_BLOG_READ,
        PERMISSION_BLOG_WRITE,
        PERMISSION_USER_READ,
        PERMISSION_USER_WRITE,
    ] {
        sqlx::query(
            "INSERT INTO permissions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
        )
        .bind(perm_name)
        .execute(pool)
        .await
        .ok();
    }

    // Seed admin role with all permissions
    let role_id: Option<(i32,)> = sqlx::query_as(
        "INSERT INTO roles (name) VALUES ('admin') ON CONFLICT (name) DO NOTHING RETURNING id",
    )
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    if let Some((rid,)) = role_id {
        sqlx::query(
            r#"
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT $1, id FROM permissions
            ON CONFLICT DO NOTHING
            "#,
        )
        .bind(rid)
        .execute(pool)
        .await
        .ok();
    }

    // Seed admin user (super_user)
    let hashed = hash_password(&settings.default_admin_password).unwrap_or_default();
    sqlx::query(
        r#"
        INSERT INTO users (username, hashed_password, super_user)
        VALUES ($1, $2, true)
        ON CONFLICT (username) DO NOTHING
        "#,
    )
    .bind(&settings.default_admin_user)
    .bind(&hashed)
    .execute(pool)
    .await
    .ok();

    seed_history(pool).await;
}

async fn seed_history(pool: &sqlx::PgPool) {
    let history_data = [
        (2017, "nl", "2017 NL", "Seizoen 2016-2017 content"),
        (2017, "en", "2017 EN", "Season 2016-2017 content"),
        (2018, "nl", "2018 NL", "Seizoen 2017-2018 content"),
        (2018, "en", "2018 EN", "Season 2017-2018 content"),
        (2019, "nl", "2019 NL", "Seizoen 2018-2019 content"),
        (2019, "en", "2019 EN", "Season 2018-2019 content"),
        (2020, "nl", "2020 NL", "Seizoen 2019-2020 content"),
        (2020, "en", "2020 EN", "Season 2019-2020 content"),
        (2021, "nl", "2021 NL", "Seizoen 2020-2021 content"),
        (2021, "en", "2021 EN", "Season 2020-2021 content"),
        (2022, "nl", "2022 NL", "Seizoen 2021-2022 content"),
        (2022, "en", "2022 EN", "Season 2021-2022 content"),
        (2023, "nl", "2023 NL", "Seizoen 2022-2023 content"),
        (2023, "en", "2023 EN", "Season 2022-2023 content"),
        (2024, "nl", "2024 NL", "Seizoen 2023-2024 content"),
        (2024, "en", "2024 EN", "Season 2023-2024 content"),
    ];

    for (year, lang, title, content) in history_data {
        sqlx::query(
            r#"
            INSERT INTO history (year, language, title, content)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (year, language) DO NOTHING
            "#,
        )
        .bind(year)
        .bind(lang)
        .bind(title)
        .bind(content)
        .execute(pool)
        .await
        .ok();
    }
}
