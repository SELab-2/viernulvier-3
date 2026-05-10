use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::worker::vnv_wrapper::VnvClient;

use super::paged_fetcher::fetch_all;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VnvGenre {
    pub id: i32,
    pub name: Option<String>,
}

pub async fn fetch_genres(client: &VnvClient) -> Result<Vec<VnvGenre>, AppError> {
    fetch_all(client, "/genres/", 100, &[]).await
}
