use std::result;

use reqwest::header::InvalidHeaderValue;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),

  #[error(transparent)]
  Jiff(#[from] jiff::Error),

  #[error(transparent)]
  InvalidHeaderValue(#[from] InvalidHeaderValue),

  #[error("Request failed with status: {0}")]
  RequestFailed(reqwest::StatusCode),
}

pub type Result<T> = result::Result<T, Error>;
