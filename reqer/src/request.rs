use std::fmt::{self, Display, Formatter};

use bytes::Bytes;
#[cfg(target_arch = "wasm32")]
use js_sys::Uint8Array;

use crate::{Response, Result};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Method {
  GET,
  POST,
  PUT,
  DELETE,
  PATCH,
  HEAD,
}

impl Method {
  #[inline]
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::GET => "GET",
      Self::POST => "POST",
      Self::PUT => "PUT",
      Self::DELETE => "DELETE",
      Self::PATCH => "PATCH",
      Self::HEAD => "HEAD",
    }
  }
}

impl AsRef<str> for Method {
  #[inline]
  fn as_ref(&self) -> &str {
    self.as_str()
  }
}

impl Display for Method {
  #[inline]
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    f.write_str(self.as_str())
  }
}

#[cfg(not(target_arch = "wasm32"))]
impl From<Method> for reqwest::Method {
  #[inline]
  fn from(m: Method) -> Self {
    match m {
      Method::GET => reqwest::Method::GET,
      Method::POST => reqwest::Method::POST,
      Method::PUT => reqwest::Method::PUT,
      Method::DELETE => reqwest::Method::DELETE,
      Method::PATCH => reqwest::Method::PATCH,
      Method::HEAD => reqwest::Method::HEAD,
    }
  }
}

#[cfg(target_arch = "wasm32")]
impl From<Method> for gloo_net::http::Method {
  #[inline]
  fn from(m: Method) -> Self {
    match m {
      Method::GET => gloo_net::http::Method::GET,
      Method::POST => gloo_net::http::Method::POST,
      Method::PUT => gloo_net::http::Method::PUT,
      Method::DELETE => gloo_net::http::Method::DELETE,
      Method::PATCH => gloo_net::http::Method::PATCH,
      Method::HEAD => gloo_net::http::Method::HEAD,
    }
  }
}

pub struct RequestBuilder {
  #[cfg(not(target_arch = "wasm32"))]
  pub(crate) inner: reqwest::RequestBuilder,
  #[cfg(target_arch = "wasm32")]
  pub(crate) inner: gloo_net::http::RequestBuilder,
  #[cfg(target_arch = "wasm32")]
  pub(crate) body: Option<Bytes>,
}

impl RequestBuilder {
  #[cfg(not(target_arch = "wasm32"))]
  #[inline]
  pub(crate) fn new(inner: reqwest::RequestBuilder) -> Self {
    Self { inner }
  }

  #[cfg(target_arch = "wasm32")]
  #[inline]
  pub(crate) fn new(method: Method, url: impl AsRef<str>) -> Self {
    Self {
      inner: gloo_net::http::RequestBuilder::new(url.as_ref()).method(method.into()),
      body: None,
    }
  }

  #[inline]
  pub fn header(mut self, key: impl AsRef<str>, val: impl AsRef<str>) -> Self {
    self.inner = self.inner.header(key.as_ref(), val.as_ref());
    self
  }

  #[inline]
  pub fn headers<K: AsRef<str>, V: AsRef<str>>(
    self,
    iter: impl IntoIterator<Item = (K, V)>,
  ) -> Self {
    iter.into_iter().fold(self, |req, (k, v)| req.header(k, v))
  }

  #[inline]
  pub fn body(mut self, body: impl Into<Bytes>) -> Self {
    let b = body.into();
    #[cfg(not(target_arch = "wasm32"))]
    {
      self.inner = self.inner.body(b);
      self
    }
    #[cfg(target_arch = "wasm32")]
    {
      self.body = Some(b);
      self
    }
  }

  pub async fn send(self) -> Result<Response> {
    #[cfg(not(target_arch = "wasm32"))]
    {
      let resp = self.inner.send().await?;
      let status = resp.status().as_u16();
      Ok(Response {
        status,
        inner: resp,
      })
    }
    #[cfg(target_arch = "wasm32")]
    {
      let resp = if let Some(body) = self.body {
        let uint8 = Uint8Array::from(&body[..]);
        self.inner.body(uint8)?.send().await?
      } else {
        self.inner.send().await?
      };

      let status = resp.status();
      Ok(Response {
        status,
        inner: resp,
      })
    }
  }
}
