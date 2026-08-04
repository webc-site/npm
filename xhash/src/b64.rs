use std::str::from_utf8_unchecked;

use base64::{Engine, prelude::BASE64_URL_SAFE_NO_PAD};
use hipstr::HipStr;

pub fn b64(buf: &[u8]) -> HipStr<'static> {
  let hash_val = crate::xhash(buf);
  let b64_len = (hash_val.len() * 4).div_ceil(3);
  let mut bytes = [0u8; 48];
  unsafe {
    BASE64_URL_SAFE_NO_PAD
      .encode_slice(&hash_val, &mut bytes[..b64_len])
      .unwrap_unchecked();
    let s = from_utf8_unchecked(&bytes[..b64_len]);
    HipStr::from(s)
  }
}
