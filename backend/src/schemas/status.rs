use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct StatusResponse {
    pub status: String,
}
