use axum::{
  extract::{FromRequestParts, Path},
  http::request::Parts,
};

use crate::api::Error;

pub struct Host(pub String);

impl<S> FromRequestParts<S> for Host
where
  S: Send + Sync,
{
  type Rejection = Error;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let Path(host) = Path::<String>::from_request_parts(parts, state)
      .await
      .map_err(|_| Error::BadRequest)?;
    let host = host.trim().to_lowercase();
    if host.is_empty() {
      return Err(Error::BadRequest);
    }
    Ok(Host(host))
  }
}
