use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::worker::vnv_wrapper::VnvClient;

use super::paged_fetcher::fetch_all;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VnvGalleryItem {
    pub id: i32,
    pub production: i32,
    pub image: Option<String>,
    pub content_type: Option<String>,
}

pub async fn fetch_gallery(client: &VnvClient) -> Result<Vec<VnvGalleryItem>, AppError> {
    fetch_all(client, "/gallery/", 200, &[]).await
}
