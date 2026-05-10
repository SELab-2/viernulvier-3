use crate::errors::AppError;

pub fn validate_language(language: &str) -> Result<(), AppError> {
    if language == "nl" || language == "en" {
        Ok(())
    } else {
        Err(AppError::Validation(format!(
            "Unsupported language '{}'. Must be 'nl' or 'en'.",
            language
        )))
    }
}

pub fn parse_accept_language(header: &str) -> Option<String> {
    for part in header.split(',') {
        let lang = part.split(';').next().unwrap_or("").trim().to_lowercase();
        if lang.starts_with("nl") {
            return Some("nl".to_string());
        }
        if lang.starts_with("en") {
            return Some("en".to_string());
        }
    }
    None
}
