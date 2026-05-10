pub mod artists;
pub mod blog_media;
pub mod blogs;
pub mod events;
pub mod halls;
pub mod history;
pub mod prod_media;
pub mod production_groups;
pub mod productions;
pub mod statistics;
pub mod tags;

use axum::{
    routing::{get, post},
    Router,
};

use crate::AppState;

use artists::list_artists_handler;
use blog_media::upload_blog_media_handler;
use blogs::{
    create_blog_handler, delete_blog_handler, get_blog_handler, list_blogs_handler,
    update_blog_handler,
};
use events::{create_event_handler, list_events_handler};
use halls::{create_hall_handler, list_halls_handler};
use history::{create_history_handler, list_history_handler};
use prod_media::upload_production_media_handler;
use production_groups::{create_production_group_handler, list_production_groups_handler};
use productions::{
    create_production_handler, delete_production_handler, get_production_handler,
    list_productions_handler, update_production_handler,
};
use statistics::statistics_handler;
use tags::{create_tag_handler, list_tags_handler};

pub fn archive_router() -> Router<AppState> {
    Router::new()
        .route("/productions", get(list_productions_handler).post(create_production_handler))
        .route(
            "/productions/{id}",
            get(get_production_handler)
                .patch(update_production_handler)
                .delete(delete_production_handler),
        )
        .route("/productions/{id}/media", post(upload_production_media_handler))
        .route("/events", get(list_events_handler).post(create_event_handler))
        .route("/halls", get(list_halls_handler).post(create_hall_handler))
        .route("/tags", get(list_tags_handler).post(create_tag_handler))
        .route(
            "/production-groups",
            get(list_production_groups_handler).post(create_production_group_handler),
        )
        .route("/artists", get(list_artists_handler))
        .route("/blogs", get(list_blogs_handler).post(create_blog_handler))
        .route(
            "/blogs/{id}",
            get(get_blog_handler)
                .patch(update_blog_handler)
                .delete(delete_blog_handler),
        )
        .route("/blogs/{id}/media", post(upload_blog_media_handler))
        .route("/statistics", get(statistics_handler))
        .route("/history", get(list_history_handler).post(create_history_handler))
}
