use viernulvier_backend::worker::converters::production::convert_production;
use viernulvier_backend::worker::converters::event::convert_event;
use viernulvier_backend::worker::converters::eventprice::convert_event_price;
use viernulvier_backend::worker::converters::genres::convert_genre;
use viernulvier_backend::worker::fetchers::production::VnvProduction;
use viernulvier_backend::worker::fetchers::event::VnvEvent;
use viernulvier_backend::worker::fetchers::eventprice::VnvEventPrice;
use viernulvier_backend::worker::fetchers::genres::VnvGenre;

#[test]
fn test_convert_production() {
    let vnv = VnvProduction {
        id: 42,
        performer_type: Some("theater".to_string()),
        attendance_mode: Some("physical".to_string()),
        title: Some("Hamlet".to_string()),
        supertitle: None,
        artist: Some("Shakespeare Company".to_string()),
        tagline: None,
        teaser: None,
        description: Some("A tragedy".to_string()),
        info: None,
    };
    let converted = convert_production(vnv);
    assert_eq!(converted.viernulvier_id, 42);
    assert_eq!(converted.performer_type, Some("theater".to_string()));
    assert_eq!(converted.title_nl, Some("Hamlet".to_string()));
    assert_eq!(converted.artist_nl, Some("Shakespeare Company".to_string()));
}

#[test]
fn test_convert_event() {
    let vnv = VnvEvent {
        id: 10,
        production: 42,
        hall: Some(5),
        starts_at: Some("2024-01-15T20:00:00".to_string()),
        ends_at: Some("2024-01-15T22:30:00".to_string()),
        order_url: Some("https://example.com".to_string()),
    };
    let converted = convert_event(vnv);
    assert_eq!(converted.viernulvier_id, 10);
    assert!(converted.starts_at.is_some());
    assert!(converted.ends_at.is_some());
    assert_eq!(converted.order_url, Some("https://example.com".to_string()));
}

#[test]
fn test_convert_event_price() {
    let vnv = VnvEventPrice {
        id: 7,
        event: 10,
        amount: Some(25.50),
        available: Some(true),
        expires_at: None,
    };
    let converted = convert_event_price(vnv);
    assert_eq!(converted.viernulvier_id, 7);
    assert_eq!(converted.amount, Some(25.50));
    assert_eq!(converted.available, Some(true));
    assert!(converted.expires_at.is_none());
}

#[test]
fn test_convert_genre() {
    let vnv = VnvGenre {
        id: 3,
        name: Some("Opera".to_string()),
    };
    let converted = convert_genre(vnv);
    assert_eq!(converted.viernulvier_id, 3);
    assert_eq!(converted.name, Some("Opera".to_string()));
}

#[test]
fn test_convert_event_with_invalid_date() {
    let vnv = VnvEvent {
        id: 99,
        production: 1,
        hall: None,
        starts_at: Some("not-a-date".to_string()),
        ends_at: None,
        order_url: None,
    };
    let converted = convert_event(vnv);
    assert!(converted.starts_at.is_none());
    assert!(converted.ends_at.is_none());
}
