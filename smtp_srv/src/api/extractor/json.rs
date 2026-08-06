use axum::body::Bytes;
use axum::extract::{FromRequest, Request};
use sonic_rs::Deserialize;

use crate::api::Error;

pub struct Json<T>(pub T);

impl<S, T> FromRequest<S> for Json<T>
where
  S: Send + Sync,
  T: for<'de> Deserialize<'de>,
{
  type Rejection = Error;

  async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
    let bytes = Bytes::from_request(req, state)
      .await
      .map_err(|_| Error::BadRequest)?;
    let val = sonic_rs::from_slice(&bytes).map_err(|_| Error::BadRequest)?;
    Ok(Json(val))
  }
}
