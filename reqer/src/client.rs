use std::sync::LazyLock;

use crate::request::{Method, RequestBuilder};

static CLIENT: LazyLock<Client> = LazyLock::new(Client::new);

#[derive(Clone, Default)]
pub struct Client {
  #[cfg(not(target_arch = "wasm32"))]
  pub(crate) inner: reqwest::Client,
}

impl Client {
  #[inline]
  pub fn new() -> Self {
    Self::default()
  }

  #[inline]
  pub fn req(&self, method: Method, url: impl AsRef<str>) -> RequestBuilder {
    let url = url.as_ref();
    #[cfg(not(target_arch = "wasm32"))]
    {
      RequestBuilder::new(self.inner.request(method.into(), url))
    }
    #[cfg(target_arch = "wasm32")]
    {
      RequestBuilder::new(method, url)
    }
  }

  #[inline]
  pub fn get(&self, url: impl AsRef<str>) -> RequestBuilder {
    self.req(Method::GET, url)
  }

  #[inline]
  pub fn post(&self, url: impl AsRef<str>) -> RequestBuilder {
    self.req(Method::POST, url)
  }

  #[inline]
  pub fn put(&self, url: impl AsRef<str>) -> RequestBuilder {
    self.req(Method::PUT, url)
  }

  #[inline]
  pub fn delete(&self, url: impl AsRef<str>) -> RequestBuilder {
    self.req(Method::DELETE, url)
  }

  #[inline]
  pub fn patch(&self, url: impl AsRef<str>) -> RequestBuilder {
    self.req(Method::PATCH, url)
  }

  #[inline]
  pub fn head(&self, url: impl AsRef<str>) -> RequestBuilder {
    self.req(Method::HEAD, url)
  }
}

#[inline]
pub fn get(url: impl AsRef<str>) -> RequestBuilder {
  CLIENT.get(url)
}

#[inline]
pub fn post(url: impl AsRef<str>) -> RequestBuilder {
  CLIENT.post(url)
}

#[inline]
pub fn put(url: impl AsRef<str>) -> RequestBuilder {
  CLIENT.put(url)
}

#[inline]
pub fn delete(url: impl AsRef<str>) -> RequestBuilder {
  CLIENT.delete(url)
}

#[inline]
pub fn patch(url: impl AsRef<str>) -> RequestBuilder {
  CLIENT.patch(url)
}

#[inline]
pub fn head(url: impl AsRef<str>) -> RequestBuilder {
  CLIENT.head(url)
}
