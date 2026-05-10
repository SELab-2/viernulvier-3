use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::worker::vnv_wrapper::VnvClient;

use super::paged_fetcher::fetch_all;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VnvEventPrice {
    pub id: i32,
    pub event: i32,
    pub amount: Option<f64>,
    pub available: Option<bool>,
    pub expires_at: Option<String>,
}

pub async fn fetch_event_prices(client: &VnvClient) -> Result<Vec<VnvEventPrice>, AppError> {
    fetch_all(client, "/eventprices/", 500, &[]).await
}
