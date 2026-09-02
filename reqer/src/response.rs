use bytes::Bytes;

use crate::{Error, Result};

pub struct Response {
  pub status: u16,
  #[cfg(not(target_arch = "wasm32"))]
  pub(crate) inner: reqwest::Response,
  #[cfg(target_arch = "wasm32")]
  pub(crate) inner: gloo_net::http::Response,
}

impl Response {
  #[inline]
  pub fn status(&self) -> u16 {
    self.status
  }

  #[inline]
  pub fn is_success(&self) -> bool {
    (200..300).contains(&self.status)
  }

  #[inline]
  pub fn is_client_error(&self) -> bool {
    (400..500).contains(&self.status)
  }

  #[inline]
  pub fn is_server_error(&self) -> bool {
    (500..600).contains(&self.status)
  }

  #[inline]
  pub fn error_for_status(self) -> Result<Self> {
    if self.is_client_error() || self.is_server_error() {
      Err(Error::Status(self.status, String::new()))
    } else {
      Ok(self)
    }
  }

  #[inline]
  pub async fn bytes(self) -> Result<Bytes> {
    #[cfg(not(target_arch = "wasm32"))]
    {
      Ok(self.inner.bytes().await?)
    }
    #[cfg(target_arch = "wasm32")]
    {
      Ok(Bytes::from(self.inner.binary().await?))
    }
  }

  #[inline]
  pub async fn text(self) -> Result<String> {
    Ok(self.inner.text().await?)
  }
}
