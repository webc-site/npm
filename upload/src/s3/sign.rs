use std::str::from_utf8_unchecked;

use hmac::{Hmac, KeyInit, Mac};
use jiff::{Timestamp, tz::TimeZone};
use memchr::memchr;
use reqwest::header::{
  AUTHORIZATION, CACHE_CONTROL, CONTENT_LENGTH, CONTENT_TYPE, HeaderMap, HeaderName, HeaderValue,
};
use sha2::{Digest, Sha256};

use crate::{S3, error::Result};

type HmacSha256 = Hmac<Sha256>;

fn hmac(key: &[u8], msg: &[u8]) -> [u8; 32] {
  let mut mac = HmacSha256::new_from_slice(key).expect("HMAC keys can be of any size");
  mac.update(msg);
  let result = mac.finalize();
  let mut bytes = [0u8; 32];
  bytes.copy_from_slice(&result.into_bytes());
  bytes
}

pub(crate) struct Hex64([u8; 64]);

impl Hex64 {
  pub(crate) fn as_str(&self) -> &str {
    unsafe { from_utf8_unchecked(&self.0) }
  }
}

pub(crate) fn sha256_hex(data: &[u8]) -> Hex64 {
  let mut hasher = Sha256::new();
  hasher.update(data);
  let hash = hasher.finalize();
  let mut bytes = [0u8; 64];
  unsafe { hex::encode_to_slice(hash, &mut bytes).unwrap_unchecked() };
  Hex64(bytes)
}

pub(crate) fn encode_hex_64(data: &[u8; 32]) -> Hex64 {
  let mut bytes = [0u8; 64];
  unsafe { hex::encode_to_slice(data, &mut bytes).unwrap_unchecked() };
  Hex64(bytes)
}

pub fn sign(
  method: &str,
  uploader: &S3,
  buf: &[u8],
  path: &str,
  mime: &str,
  cache_control: &str,
) -> Result<HeaderMap> {
  let now = Timestamp::from_second(ts_::sec() as i64)?;
  let datetime = now.to_zoned(TimeZone::UTC);

  let year = datetime.year();
  let month = datetime.month();
  let day = datetime.day();
  let hour = datetime.hour();
  let minute = datetime.minute();
  let second = datetime.second();

  let mut amz_buf = [0u8; 16];
  let y = year as u16;
  amz_buf[0] = b'0' + (y / 1000) as u8;
  amz_buf[1] = b'0' + ((y / 100) % 10) as u8;
  amz_buf[2] = b'0' + ((y / 10) % 10) as u8;
  amz_buf[3] = b'0' + (y % 10) as u8;

  let m = month as u8;
  amz_buf[4] = b'0' + (m / 10);
  amz_buf[5] = b'0' + (m % 10);

  let d = day as u8;
  amz_buf[6] = b'0' + (d / 10);
  amz_buf[7] = b'0' + (d % 10);

  amz_buf[8] = b'T';

  let h = hour as u8;
  amz_buf[9] = b'0' + (h / 10);
  amz_buf[10] = b'0' + (h % 10);

  let min = minute as u8;
  amz_buf[11] = b'0' + (min / 10);
  amz_buf[12] = b'0' + (min % 10);

  let sec = second as u8;
  amz_buf[13] = b'0' + (sec / 10);
  amz_buf[14] = b'0' + (sec % 10);

  amz_buf[15] = b'Z';

  let amz_date = unsafe { from_utf8_unchecked(&amz_buf) };
  let date_only = &amz_date[0..8];

  let payload_hash = sha256_hex(buf);
  let payload_hash_str = payload_hash.as_str();

  let url_prefix = &uploader.url_prefix;
  let host_bucket = &url_prefix[8..];
  let slash_idx = unsafe { memchr(b'/', host_bucket.as_bytes()).unwrap_unchecked() };
  let s3_host = &host_bucket[..slash_idx];
  let s3_bucket = &host_bucket[slash_idx + 1..host_bucket.len() - 1];
  let canonical_request = format!(
    "{method}\n\
     /{s3_bucket}/{path}\n\
     \n\
     cache-control:{cache_control}\n\
     content-type:{mime}\n\
     host:{s3_host}\n\
     x-amz-content-sha256:{payload_hash_str}\n\
     x-amz-date:{amz_date}\n\
     \n\
     cache-control;content-type;host;x-amz-content-sha256;x-amz-date\n\
     {payload_hash_str}"
  );

  let canonical_request_hash = sha256_hex(canonical_request.as_bytes());
  let canonical_request_hash_str = canonical_request_hash.as_str();
  let s3_region = &uploader.s3_region;
  let credential_scope = format!("{date_only}/{s3_region}/s3/aws4_request");

  let string_to_sign = format!(
    "AWS4-HMAC-SHA256\n\
     {amz_date}\n\
     {credential_scope}\n\
     {canonical_request_hash_str}"
  );

  let sk_bytes = uploader.s3_sk.as_bytes();
  let mut key_buf = [0u8; 128];
  let k_date = if sk_bytes.len() + 4 <= 128 {
    key_buf[..4].copy_from_slice(b"AWS4");
    key_buf[4..4 + sk_bytes.len()].copy_from_slice(sk_bytes);
    hmac(&key_buf[..4 + sk_bytes.len()], date_only.as_bytes())
  } else {
    let mut key = Vec::with_capacity(4 + sk_bytes.len());
    key.extend_from_slice(b"AWS4");
    key.extend_from_slice(sk_bytes);
    hmac(&key, date_only.as_bytes())
  };

  let k_region = hmac(&k_date, uploader.s3_region.as_bytes());
  let k_service = hmac(&k_region, b"s3");
  let k_signing = hmac(&k_service, b"aws4_request");
  let signature = hmac(&k_signing, string_to_sign.as_bytes());
  let signature_hex = encode_hex_64(&signature);
  let signature_hex_str = signature_hex.as_str();

  let mut headers = HeaderMap::new();
  headers.insert(CACHE_CONTROL, HeaderValue::try_from(cache_control)?);
  headers.insert(CONTENT_TYPE, HeaderValue::try_from(mime)?);
  headers.insert(CONTENT_LENGTH, HeaderValue::from(buf.len() as u64));

  let s3_id = &uploader.s3_id;
  let authorization = format!(
    "AWS4-HMAC-SHA256 Credential={s3_id}/{credential_scope},SignedHeaders=cache-control;content-type;host;x-amz-content-sha256;x-amz-date, Signature={signature_hex_str}"
  );
  headers.insert(AUTHORIZATION, HeaderValue::try_from(authorization)?);

  headers.insert(
    HeaderName::from_static("x-amz-content-sha256"),
    HeaderValue::try_from(payload_hash_str)?,
  );
  headers.insert(
    HeaderName::from_static("x-amz-date"),
    HeaderValue::try_from(amz_date)?,
  );

  Ok(headers)
}
