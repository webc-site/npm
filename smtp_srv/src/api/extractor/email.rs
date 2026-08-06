use axum::{
  extract::{FromRequestParts, Path},
  http::request::Parts,
};

use crate::api::Error;

pub struct Email {
  pub prefix: String,
  pub host: String,
}

impl<S> FromRequestParts<S> for Email
where
  S: Send + Sync,
{
  type Rejection = Error;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let Path(email) = Path::<String>::from_request_parts(parts, state)
      .await
      .map_err(|_| Error::BadRequest)?;
    let email = email.trim().to_lowercase();
    let Some((prefix, host)) = email.split_once('@') else {
      return Err(Error::BadRequest);
    };
    if prefix.is_empty() || host.is_empty() {
      return Err(Error::BadRequest);
    }
    Ok(Email {
      prefix: prefix.to_string(),
      host: host.to_string(),
    })
  }
}
