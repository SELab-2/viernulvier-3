use chrono::NaiveDateTime;

use crate::worker::fetchers::eventprice::VnvEventPrice;

pub struct ConvertedEventPrice {
    pub viernulvier_id: i32,
    pub event_vnv_id: i32,
    pub amount: Option<f64>,
    pub available: Option<bool>,
    pub expires_at: Option<NaiveDateTime>,
}

pub fn convert_event_price(vnv: VnvEventPrice) -> ConvertedEventPrice {
    let parse = |s: &str| NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S")
        .or_else(|_| NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S%.f"))
        .ok();

    ConvertedEventPrice {
        viernulvier_id: vnv.id,
        event_vnv_id: vnv.event,
        amount: vnv.amount,
        available: vnv.available,
        expires_at: vnv.expires_at.as_deref().and_then(parse),
    }
}
