use sqlx::PgPool;
use std::sync::Arc;

use crate::config::Settings;
use crate::worker::sync::sync_new::run_full_sync;
use crate::worker::vnv_wrapper::VnvClient;

pub async fn run_sync(pool: PgPool, settings: Arc<Settings>) {
    let client = VnvClient::new(settings.viernulvier_key.clone());

    match run_full_sync(&pool, &client).await {
        Ok(()) => tracing::info!("Sync completed successfully"),
        Err(e) => tracing::error!("Sync failed: {:?}", e),
    }
}
