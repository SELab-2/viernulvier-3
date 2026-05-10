use serde::Deserialize;
use viernulvier_backend::worker::csv_parser::parse_csv_bytes;

#[derive(Debug, Deserialize, PartialEq)]
struct Row {
    name: String,
    value: i32,
}

#[test]
fn test_parse_csv_bytes_valid() {
    let data = b"name,value\nfoo,1\nbar,2\n";
    let rows: Vec<Row> = parse_csv_bytes(data).unwrap();
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0], Row { name: "foo".to_string(), value: 1 });
    assert_eq!(rows[1], Row { name: "bar".to_string(), value: 2 });
}

#[test]
fn test_parse_csv_bytes_empty() {
    let data = b"name,value\n";
    let rows: Vec<Row> = parse_csv_bytes(data).unwrap();
    assert_eq!(rows.len(), 0);
}

#[test]
fn test_parse_csv_bytes_invalid_type() {
    let data = b"name,value\nfoo,notanumber\n";
    let result: Result<Vec<Row>, _> = parse_csv_bytes(data);
    assert!(result.is_err());
}
