use std::result::Result as StdResult;

use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use fred::error::Error as FredError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error("Bad Request")]
  BadRequest,

  #[error(transparent)]
  Fred(#[from] FredError),

  #[error(transparent)]
  GetRandom(#[from] getrandom::Error),

  #[error(transparent)]
  Sonic(#[from] sonic_rs::Error),
}

impl IntoResponse for Error {
  fn into_response(self) -> Response {
    match self {
      Error::BadRequest => StatusCode::BAD_REQUEST.into_response(),
      _ => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
  }
}

pub type Result<T, E = Error> = StdResult<T, E>;
