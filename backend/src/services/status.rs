use crate::schemas::status::StatusResponse;

pub fn get_status() -> StatusResponse {
    StatusResponse {
        status: "ok".to_string(),
    }
}
