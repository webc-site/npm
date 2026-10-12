use bytes::Bytes;
use hipstr::HipStr;
use xhash::b64;

use crate::{S3, error::Result};

impl S3 {
  pub async fn upload_xhash(
    &self,
    file_name: impl AsRef<str>,
    buf: impl Into<Bytes>,
  ) -> Result<HipStr<'static>> {
    let buf = buf.into();
    let file_name = file_name.as_ref();
    let xhash_val = b64(&buf);

    self.upload_if_not_exist(&xhash_val, file_name, buf).await?;

    Ok(xhash_val)
  }
}
