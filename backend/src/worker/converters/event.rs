use chrono::NaiveDateTime;

use crate::worker::fetchers::event::VnvEvent;

pub struct ConvertedEvent {
    pub viernulvier_id: i32,
    pub production_vnv_id: i32,
    pub hall_vnv_id: Option<i32>,
    pub starts_at: Option<NaiveDateTime>,
    pub ends_at: Option<NaiveDateTime>,
    pub order_url: Option<String>,
}

pub fn convert_event(vnv: VnvEvent) -> ConvertedEvent {
    let parse = |s: &str| NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S")
        .or_else(|_| NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S%.f"))
        .ok();

    ConvertedEvent {
        viernulvier_id: vnv.id,
        production_vnv_id: vnv.production,
        hall_vnv_id: vnv.hall,
        starts_at: vnv.starts_at.as_deref().and_then(parse),
        ends_at: vnv.ends_at.as_deref().and_then(parse),
        order_url: vnv.order_url,
    }
}
