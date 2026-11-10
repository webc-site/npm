use std::time::Duration;
mod error;
#[cfg(feature = "proxy")]
mod proxy;
#[cfg(feature = "retry")]
pub mod retry;

use bytes::Bytes;
pub use error::{Error, Result};
pub use reqwest;
use reqwest::{Body, Client, IntoUrl, RequestBuilder, StatusCode, redirect::Policy};

#[static_init::dynamic]
pub static REQ: Client = {
  let b = Client::builder()
    .redirect(Policy::limited(6))
    .timeout(Duration::from_secs(100))
    .gzip(true)
    .brotli(true)
    .zstd(true)
    .connect_timeout(Duration::from_secs(9));

  #[cfg(feature = "proxy")]
  let b = proxy::proxy(b);

  b.build().unwrap()
};

pub const SUCCESS_STATUS: [StatusCode; 5] = [
  StatusCode::OK,
  StatusCode::NO_CONTENT,
  StatusCode::PERMANENT_REDIRECT,
  StatusCode::TEMPORARY_REDIRECT,
  StatusCode::PARTIAL_CONTENT,
];

#[inline]
pub fn is_success(status: StatusCode) -> bool {
  SUCCESS_STATUS.contains(&status)
}

pub(crate) async fn send_single(req: RequestBuilder) -> Result<Bytes> {
  let res = req.send().await?;
  let status = res.status();
  if is_success(status) {
    let bin = res.bytes().await?;
    Ok(bin)
  } else {
    Err(Error::Status(Box::new(res)))
  }
}

pub(crate) fn bytes_to_string(bin: Bytes) -> String {
  match String::from_utf8(bin.to_vec()) {
    Ok(s) => s,
    Err(e) => String::from_utf8_lossy(e.as_bytes()).into_owned(),
  }
}

pub async fn req(req: RequestBuilder) -> Result<Bytes> {
  #[cfg(feature = "retry")]
  {
    retry::Retry::default().req(req).await
  }
  #[cfg(not(feature = "retry"))]
  {
    send_single(req).await
  }
}

async fn req_str(builder: RequestBuilder) -> Result<String> {
  let bin = req(builder).await?;
  Ok(bytes_to_string(bin))
}

pub async fn getbin(url: impl IntoUrl) -> Result<Bytes> {
  req(REQ.get(url.into_url()?)).await
}

pub async fn get(url: impl IntoUrl) -> Result<String> {
  req_str(REQ.get(url.into_url()?)).await
}

macro_rules! method {
  ($($method: ident),*) => {
    $(
    pub async fn $method(url: impl IntoUrl, body:impl Into<Body>) -> Result<String> {
      let r = REQ.$method(url.into_url()?).body(body);
      req_str(r).await
    }
    )*
  };
}

method!(post, delete, patch, put);
