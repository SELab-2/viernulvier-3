use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ArtistResponse {
    pub artist: String,
}

#[derive(Debug, Serialize)]
pub struct ArtistsListResponse {
    pub items: Vec<ArtistResponse>,
    pub count: usize,
}
