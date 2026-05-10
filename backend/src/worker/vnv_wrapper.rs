use reqwest::Client;
use serde::de::DeserializeOwned;
use serde_json::Value;

use crate::errors::AppError;

pub struct VnvClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl VnvClient {
    pub fn new(api_key: String) -> Self {
        VnvClient {
            client: Client::new(),
            base_url: "https://api.viernulvier.be/api/v3".to_string(),
            api_key,
        }
    }

    pub async fn get_paged<T: DeserializeOwned>(
        &self,
        path: &str,
        page: u32,
        page_size: u32,
        extra_params: &[(&str, &str)],
    ) -> Result<(Vec<T>, bool), AppError> {
        let url = format!("{}{}", self.base_url, path);
        let mut params = vec![
            ("page".to_string(), page.to_string()),
            ("page_size".to_string(), page_size.to_string()),
        ];
        for (k, v) in extra_params {
            params.push((k.to_string(), v.to_string()));
        }

        let resp = self
            .client
            .get(&url)
            .header("Authorization", format!("Token {}", self.api_key))
            .query(&params)
            .send()
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(AppError::Internal(format!(
                "VNV API error: {}",
                resp.status()
            )));
        }

        let body: Value = resp
            .json()
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        let results = body
            .get("results")
            .and_then(|r| serde_json::from_value(r.clone()).ok())
            .unwrap_or_default();

        let has_next = body.get("next").and_then(|v| v.as_str()).is_some();

        Ok((results, has_next))
    }

    pub async fn get_all<T: DeserializeOwned>(
        &self,
        path: &str,
        page_size: u32,
        extra_params: &[(&str, &str)],
    ) -> Result<Vec<T>, AppError> {
        let mut all = Vec::new();
        let mut page = 1;
        loop {
            let (items, has_next) = self.get_paged(path, page, page_size, extra_params).await?;
            all.extend(items);
            if !has_next {
                break;
            }
            page += 1;
        }
        Ok(all)
    }
}
