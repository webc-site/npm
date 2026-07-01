use std::{env, time::Duration};

use bytes::Bytes;
use reqwest::{Body, IntoUrl, RequestBuilder, StatusCode};
use tokio::time::sleep;

use crate::{Error, Result};

#[derive(Debug, Clone, Copy)]
pub struct Retry {
  pub retry: usize,
  pub delay: Duration,
}

#[static_init::dynamic]
static DEFAULT_RETRY: (usize, Duration) = {
  let retry = env::var("IREQ_RETRY")
    .ok()
    .and_then(|v| v.parse().ok())
    .unwrap_or(3);
  let delay_ms = env::var("IREQ_RETRY_DELAY")
    .ok()
    .and_then(|v| v.parse().ok())
    .unwrap_or(100);
  (retry, Duration::from_millis(delay_ms))
};

impl Default for Retry {
  fn default() -> Self {
    let &(retry, delay) = &*DEFAULT_RETRY;
    Self { retry, delay }
  }
}

impl Retry {
  pub fn new(retry: usize, delay: Duration) -> Self {
    Self { retry, delay }
  }

  pub async fn req(&self, builder: RequestBuilder) -> Result<Bytes> {
    req(builder, self.retry, self.delay).await
  }

  pub async fn bin(&self, url: impl IntoUrl) -> Result<Bytes> {
    self.req(crate::REQ.get(url.into_url()?)).await
  }

  async fn str(&self, builder: RequestBuilder) -> Result<String> {
    let bin = self.req(builder).await?;
    Ok(crate::bytes_to_string(bin))
  }

  pub async fn get(&self, url: impl IntoUrl) -> Result<String> {
    self.str(crate::REQ.get(url.into_url()?)).await
  }
}

macro_rules! method {
  ($($method: ident),*) => {
    $(
    impl Retry {
      pub async fn $method(&self, url: impl IntoUrl, body: impl Into<Body>) -> Result<String> {
        let r = crate::REQ.$method(url.into_url()?).body(body);
        self.str(r).await
      }
    }
    )*
  };
}

method!(post, delete, patch, put);

pub async fn req(mut req: RequestBuilder, mut retry: usize, delay: Duration) -> Result<Bytes> {
  loop {
    let req_clone = if retry > 0 { req.try_clone() } else { None };

    let result = crate::send_single(req).await;

    match result {
      Ok(bin) => return Ok(bin),
      Err(err) => {
        let is_404 = matches!(&err, Error::Status(res) if res.status() == StatusCode::NOT_FOUND);
        if is_404 || retry == 0 {
          return Err(err);
        }
        if let Some(r) = req_clone {
          if !delay.is_zero() {
            sleep(delay).await;
          }
          retry -= 1;
          req = r;
        } else {
          return Err(err);
        }
      }
    }
  }
}
