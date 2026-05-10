use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
};

use crate::services::language::parse_accept_language;

pub struct AcceptedLanguage(pub Option<String>);

#[async_trait]
impl<S> FromRequestParts<S> for AcceptedLanguage
where
    S: Send + Sync,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let lang = parts
            .headers
            .get("Accept-Language")
            .and_then(|v| v.to_str().ok())
            .and_then(parse_accept_language);
        Ok(AcceptedLanguage(lang))
    }
}
