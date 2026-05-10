// Fetcher tests require live network access to the VNV API.
// These are smoke tests for the struct definitions.

use viernulvier_backend::worker::fetchers::production::VnvProduction;
use viernulvier_backend::worker::fetchers::event::VnvEvent;
use viernulvier_backend::worker::fetchers::halls::VnvHall;

#[test]
fn test_vnv_production_deserializes() {
    let json = r#"{"id":1,"performer_type":"theater","attendance_mode":null,"title":"Test","supertitle":null,"artist":null,"tagline":null,"teaser":null,"description":null,"info":null}"#;
    let prod: VnvProduction = serde_json::from_str(json).unwrap();
    assert_eq!(prod.id, 1);
    assert_eq!(prod.performer_type, Some("theater".to_string()));
}

#[test]
fn test_vnv_event_deserializes() {
    let json = r#"{"id":5,"production":1,"hall":null,"starts_at":"2024-01-01T20:00:00","ends_at":null,"order_url":null}"#;
    let event: VnvEvent = serde_json::from_str(json).unwrap();
    assert_eq!(event.id, 5);
    assert_eq!(event.production, 1);
}

#[test]
fn test_vnv_hall_deserializes() {
    let json = r#"{"id":3,"name":"Grote Zaal","address":"Markt 1"}"#;
    let hall: VnvHall = serde_json::from_str(json).unwrap();
    assert_eq!(hall.id, 3);
    assert_eq!(hall.name, Some("Grote Zaal".to_string()));
}
