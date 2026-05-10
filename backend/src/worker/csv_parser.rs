use serde::de::DeserializeOwned;

use crate::errors::AppError;

pub fn parse_csv_bytes<T: DeserializeOwned>(data: &[u8]) -> Result<Vec<T>, AppError> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_reader(data);

    let mut records = Vec::new();
    for result in reader.deserialize::<T>() {
        let record = result.map_err(|e| AppError::Internal(e.to_string()))?;
        records.push(record);
    }
    Ok(records)
}
