use std::result;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
  #[cfg(not(target_arch = "wasm32"))]
  #[error(transparent)]
  Http(#[from] reqwest::Error),

  #[cfg(target_arch = "wasm32")]
  #[error(transparent)]
  Http(#[from] gloo_net::Error),

  #[error("http status {0}: {1}")]
  Status(u16, String),

  #[error("invalid header")]
  Header,
}

pub type Result<T> = result::Result<T, Error>;
