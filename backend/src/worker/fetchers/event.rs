use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::worker::vnv_wrapper::VnvClient;

use super::paged_fetcher::fetch_all;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VnvEvent {
    pub id: i32,
    pub production: i32,
    pub hall: Option<i32>,
    pub starts_at: Option<String>,
    pub ends_at: Option<String>,
    pub order_url: Option<String>,
}

pub async fn fetch_events(client: &VnvClient) -> Result<Vec<VnvEvent>, AppError> {
    fetch_all(client, "/events/", 200, &[]).await
}
