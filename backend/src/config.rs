use std::env;

#[derive(Clone, Debug)]
pub struct Settings {
    pub app_title: String,
    pub api_version: String,

    pub postgres_user: String,
    pub postgres_password: String,
    pub postgres_db: String,
    pub database_host: String,
    pub database_port: u16,

    pub jwt_secret_key: String,
    pub jwt_algorithm: String,
    pub access_token_expire_minutes: i64,
    pub refresh_token_expire_minutes: i64,

    pub viernulvier_key: String,

    pub minio_root_user: String,
    pub minio_root_password: String,
    pub minio_endpoint: String,
    pub minio_bucket: String,

    pub default_admin_user: String,
    pub default_admin_password: String,
}

impl Settings {
    pub fn from_env() -> Self {
        Settings {
            app_title: env::var("APP_TITLE")
                .unwrap_or_else(|_| "Viernulvier archive API".to_string()),
            api_version: env::var("API_VERSION").unwrap_or_else(|_| "0.1.0".to_string()),

            postgres_user: env::var("POSTGRES_USER").expect("POSTGRES_USER must be set"),
            postgres_password: env::var("POSTGRES_PASSWORD")
                .expect("POSTGRES_PASSWORD must be set"),
            postgres_db: env::var("POSTGRES_DB").expect("POSTGRES_DB must be set"),
            database_host: env::var("DATABASE_HOST").expect("DATABASE_HOST must be set"),
            database_port: env::var("DATABASE_PORT")
                .unwrap_or_else(|_| "5432".to_string())
                .parse()
                .expect("DATABASE_PORT must be a valid u16"),

            jwt_secret_key: env::var("JWT_SECRET_KEY").expect("JWT_SECRET_KEY must be set"),
            jwt_algorithm: env::var("JWT_ALGORITHM").unwrap_or_else(|_| "HS256".to_string()),
            access_token_expire_minutes: env::var("ACCESS_TOKEN_EXPIRE_MINUTES")
                .unwrap_or_else(|_| "30".to_string())
                .parse()
                .expect("ACCESS_TOKEN_EXPIRE_MINUTES must be a valid i64"),
            refresh_token_expire_minutes: env::var("REFRESH_TOKEN_EXPIRE_MINUTES")
                .unwrap_or_else(|_| "43200".to_string())
                .parse()
                .expect("REFRESH_TOKEN_EXPIRE_MINUTES must be a valid i64"),

            viernulvier_key: env::var("VIERNULVIER_KEY")
                .unwrap_or_else(|_| "".to_string()),

            minio_root_user: env::var("MINIO_ROOT_USER")
                .expect("MINIO_ROOT_USER must be set"),
            minio_root_password: env::var("MINIO_ROOT_PASSWORD")
                .expect("MINIO_ROOT_PASSWORD must be set"),
            minio_endpoint: env::var("MINIO_ENDPOINT")
                .unwrap_or_else(|_| "minio:9000".to_string()),
            minio_bucket: env::var("MINIO_BUCKET").unwrap_or_else(|_| "media".to_string()),

            default_admin_user: env::var("DEFAULT_ADMIN_USER")
                .unwrap_or_else(|_| "admin".to_string()),
            default_admin_password: env::var("DEFAULT_ADMIN_PASSWORD")
                .unwrap_or_else(|_| "admin".to_string()),
        }
    }

    pub fn database_url(&self) -> String {
        format!(
            "postgresql://{}:{}@{}:{}/{}",
            self.postgres_user,
            self.postgres_password,
            self.database_host,
            self.database_port,
            self.postgres_db
        )
    }
}
