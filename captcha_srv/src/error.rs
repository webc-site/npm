use std::{io, net::AddrParseError, result};

use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use thiserror::Error;
use xkv::fred::error::Error as RedisError;

#[derive(Error, Debug)]
pub enum Error {
  #[error(transparent)]
  AddrParse(#[from] AddrParseError),

  #[error(transparent)]
  Anyhow(#[from] anyhow::Error),

  #[error(transparent)]
  AxumGracefulRestart(#[from] axum_graceful_restart::Error),

  #[error(transparent)]
  Io(#[from] io::Error),

  #[error(transparent)]
  Redis(#[from] RedisError),

  #[error(transparent)]
  SvgCaptcha(#[from] svg_captcha::Error),
}

impl IntoResponse for Error {
  fn into_response(self) -> Response {
    log::error!("{self}");
    (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()).into_response()
  }
}

pub type Result<T> = result::Result<T, Error>;
