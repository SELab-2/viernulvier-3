use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::worker::vnv_wrapper::VnvClient;

use super::paged_fetcher::fetch_all;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VnvHall {
    pub id: i32,
    pub name: Option<String>,
    pub address: Option<String>,
}

pub async fn fetch_halls(client: &VnvClient) -> Result<Vec<VnvHall>, AppError> {
    fetch_all(client, "/halls/", 100, &[]).await
}
