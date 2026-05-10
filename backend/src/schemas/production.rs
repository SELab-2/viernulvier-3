use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

use super::event::EventResponse;
use super::media::MediaResponse;
use super::tag::TagResponse;
use super::production_group::ProductionGroupResponse;

#[derive(Debug, Serialize, Clone)]
pub struct ProdInfoResponse {
    pub production_id: i32,
    pub language: String,
    pub title: Option<String>,
    pub supertitle: Option<String>,
    pub artist: Option<String>,
    pub tagline: Option<String>,
    pub teaser: Option<String>,
    pub description: Option<String>,
    pub info: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ProductionResponse {
    pub id: i32,
    pub viernulvier_id: Option<i32>,
    pub performer_type: Option<String>,
    pub attendance_mode: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub earliest_at: Option<NaiveDateTime>,
    pub latest_at: Option<NaiveDateTime>,
    pub info: Option<ProdInfoResponse>,
    pub tags: Vec<TagResponse>,
    pub groups: Vec<ProductionGroupResponse>,
    pub events: Vec<EventResponse>,
    pub media: Vec<MediaResponse>,
}

#[derive(Debug, Serialize)]
pub struct ProductionListResponse {
    pub items: Vec<ProductionResponse>,
    pub next_cursor: Option<String>,
    pub count: usize,
}

#[derive(Debug, Deserialize)]
pub struct ProductionCreate {
    pub viernulvier_id: Option<i32>,
    pub performer_type: Option<String>,
    pub attendance_mode: Option<String>,
    pub title_nl: Option<String>,
    pub title_en: Option<String>,
    pub supertitle_nl: Option<String>,
    pub supertitle_en: Option<String>,
    pub artist_nl: Option<String>,
    pub artist_en: Option<String>,
    pub tagline_nl: Option<String>,
    pub tagline_en: Option<String>,
    pub teaser_nl: Option<String>,
    pub teaser_en: Option<String>,
    pub description_nl: Option<String>,
    pub description_en: Option<String>,
    pub info_nl: Option<String>,
    pub info_en: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ProductionUpdate {
    pub viernulvier_id: Option<i32>,
    pub performer_type: Option<String>,
    pub attendance_mode: Option<String>,
    pub title_nl: Option<String>,
    pub title_en: Option<String>,
    pub supertitle_nl: Option<String>,
    pub supertitle_en: Option<String>,
    pub artist_nl: Option<String>,
    pub artist_en: Option<String>,
    pub tagline_nl: Option<String>,
    pub tagline_en: Option<String>,
    pub teaser_nl: Option<String>,
    pub teaser_en: Option<String>,
    pub description_nl: Option<String>,
    pub description_en: Option<String>,
    pub info_nl: Option<String>,
    pub info_en: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ProductionListQuery {
    pub cursor: Option<String>,
    pub limit: Option<i64>,
    pub tag_id: Option<i32>,
    pub group_id: Option<i32>,
    pub search: Option<String>,
}
