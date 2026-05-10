use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize)]
struct CursorPayload {
    earliest_at: Option<String>,
    id: i32,
}

pub fn encode_cursor(earliest_at: Option<NaiveDateTime>, id: i32) -> String {
    let payload = CursorPayload {
        earliest_at: earliest_at.map(|dt| dt.format("%Y-%m-%dT%H:%M:%S%.f").to_string()),
        id,
    };
    let json = serde_json::to_string(&payload).unwrap_or_default();
    URL_SAFE_NO_PAD.encode(json.as_bytes())
}

pub fn decode_cursor(cursor: &str) -> Result<(Option<NaiveDateTime>, i32), AppError> {
    let bytes = URL_SAFE_NO_PAD
        .decode(cursor)
        .map_err(|_| AppError::BadRequest("Invalid cursor encoding".to_string()))?;
    let payload: CursorPayload = serde_json::from_slice(&bytes)
        .map_err(|_| AppError::BadRequest("Invalid cursor format".to_string()))?;
    let earliest_at = payload
        .earliest_at
        .map(|s| {
            NaiveDateTime::parse_from_str(&s, "%Y-%m-%dT%H:%M:%S%.f")
                .or_else(|_| NaiveDateTime::parse_from_str(&s, "%Y-%m-%dT%H:%M:%S"))
                .map_err(|_| AppError::BadRequest("Invalid cursor date".to_string()))
        })
        .transpose()?;
    Ok((earliest_at, payload.id))
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub items: Vec<T>,
    pub next_cursor: Option<String>,
    pub count: usize,
}
