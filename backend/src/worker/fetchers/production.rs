use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::worker::vnv_wrapper::VnvClient;

use super::paged_fetcher::fetch_all;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VnvProduction {
    pub id: i32,
    pub performer_type: Option<String>,
    pub attendance_mode: Option<String>,
    pub title: Option<String>,
    pub supertitle: Option<String>,
    pub artist: Option<String>,
    pub tagline: Option<String>,
    pub teaser: Option<String>,
    pub description: Option<String>,
    pub info: Option<String>,
}

pub async fn fetch_productions(client: &VnvClient) -> Result<Vec<VnvProduction>, AppError> {
    fetch_all(client, "/productions/", 100, &[]).await
}
