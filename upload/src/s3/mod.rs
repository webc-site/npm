mod sign;
use std::time::Duration;

use bytes::Bytes;
use ext_mime::mime;
use hipstr::HipStr;
pub use sign::sign;
#[cfg(feature = "xhash")]
mod upload_xhash;

use crate::{Error, error::Result};

#[derive(Debug, Clone)]
pub enum Conf {
  Client(reqwest::Client),
  CacheControl(HipStr<'static>),
  Timeout(Duration),
  ConnectTimeout(Duration),
}

pub struct S3 {
  pub s3_id: HipStr<'static>,
  pub s3_sk: HipStr<'static>,
  pub s3_region: HipStr<'static>,
  pub url_prefix: HipStr<'static>,
  pub cache_control: HipStr<'static>,
  pub client: reqwest::Client,
}

impl S3 {
  pub fn new(
    s3_id: impl Into<HipStr<'static>>,
    s3_sk: impl Into<HipStr<'static>>,
    s3_host: impl Into<HipStr<'static>>,
    s3_bucket: impl Into<HipStr<'static>>,
    s3_region: impl Into<HipStr<'static>>,
    conf_li: impl AsRef<[Conf]>,
  ) -> Self {
    let url_prefix = HipStr::from(format!("https://{}/{}/", s3_host.into(), s3_bucket.into()));

    let mut client = None;
    let mut cache_control = None;
    let mut timeout = Duration::from_secs(100);
    let mut connect_timeout = Duration::from_secs(6);

    for conf in conf_li.as_ref() {
      match conf {
        Conf::Client(c) => client = Some(c.clone()),
        Conf::CacheControl(cc) => cache_control = Some(cc.clone()),
        Conf::Timeout(t) => timeout = *t,
        Conf::ConnectTimeout(ct) => connect_timeout = *ct,
      }
    }

    let client = client.unwrap_or_else(|| {
      reqwest::Client::builder()
        .connect_timeout(connect_timeout)
        .timeout(timeout)
        .build()
        .unwrap()
    });
    let cache_control =
      cache_control.unwrap_or_else(|| HipStr::from_static("public,max-age=99999999,immutable"));

    Self {
      s3_id: s3_id.into(),
      s3_sk: s3_sk.into(),
      s3_region: s3_region.into(),
      url_prefix,
      cache_control,
      client,
    }
  }

  pub async fn upload(
    &self,
    path: impl AsRef<str>,
    file_name: impl AsRef<str>,
    buf: impl Into<Bytes>,
  ) -> Result<()> {
    let buf = buf.into();
    let path = path.as_ref();
    let file_name = file_name.as_ref();
    let url_prefix = &self.url_prefix;
    let url = format!("{url_prefix}{path}");
    let mime = mime(file_name);
    let cache_control = &self.cache_control;

    let headers = sign("PUT", self, &buf, path, mime, cache_control)?;

    let resp = self
      .client
      .put(&url)
      .headers(headers)
      .body(buf)
      .send()
      .await?;

    if !resp.status().is_success() {
      return Err(Error::RequestFailed(resp.status()));
    }

    Ok(())
  }

  pub async fn upload_if_not_exist(
    &self,
    path: impl AsRef<str>,
    file_name: impl AsRef<str>,
    buf: impl Into<Bytes>,
  ) -> Result<bool> {
    let buf = buf.into();
    let path = path.as_ref();
    let file_name = file_name.as_ref();
    let url_prefix = &self.url_prefix;
    let url = format!("{url_prefix}{path}");

    let has_file = match self
      .client
      .head(&url)
      .timeout(Duration::from_secs(6))
      .send()
      .await
    {
      Ok(resp) => resp.status().is_success(),
      Err(_) => false,
    };

    if has_file {
      return Ok(false);
    }

    self.upload(path, file_name, buf).await?;

    Ok(true)
  }

  pub async fn delete(&self, path: impl AsRef<str>) -> Result<()> {
    let path = path.as_ref();
    let url_prefix = &self.url_prefix;
    let url = format!("{url_prefix}{path}");

    let headers = sign("DELETE", self, &[], path, "", "")?;

    let resp = self.client.delete(&url).headers(headers).send().await?;

    let status = resp.status();
    if !status.is_success() && status != reqwest::StatusCode::NOT_FOUND {
      return Err(Error::RequestFailed(status));
    }

    Ok(())
  }
}
