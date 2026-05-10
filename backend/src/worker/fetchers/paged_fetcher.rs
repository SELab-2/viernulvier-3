use serde::de::DeserializeOwned;

use crate::errors::AppError;
use crate::worker::vnv_wrapper::VnvClient;

pub async fn fetch_all<T: DeserializeOwned>(
    client: &VnvClient,
    path: &str,
    page_size: u32,
    extra_params: &[(&str, &str)],
) -> Result<Vec<T>, AppError> {
    client.get_all(path, page_size, extra_params).await
}
