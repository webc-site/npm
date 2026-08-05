use axum::{
  body::Bytes,
  http::header::{CONTENT_TYPE, HeaderName},
  response::IntoResponse,
};
use xkv::{
  R,
  fred::{interfaces::KeysInterface, types::Expiration},
};

use super::{CAPTCHA_NUM, EXPIRE_S};
use crate::{Result, captcha_key};

/// Response header for JSON responses.
pub const JSON_H: [(HeaderName, &'static str); 1] = [(CONTENT_TYPE, "text/json")];

/// Successful verification response.
pub const OK: Result<([(HeaderName, &'static str); 1], &'static str)> = Ok((JSON_H, "1"));

/// Failed verification response.
pub const ERR: Result<([(HeaderName, &'static str); 1], &'static str)> = Ok((JSON_H, "0"));

/// Verifies clicked positions against stored CAPTCHA coordinates.
/// On success, clears Redis value, refreshes TTL, and returns OK ("1").
pub async fn post(body: Bytes) -> Result<impl IntoResponse> {
  let Some((id_bytes, clicks_buf)) = body.split_first_chunk::<16>() else {
    return ERR;
  };

  if clicks_buf.len() != CAPTCHA_NUM * 4 {
    return ERR;
  }

  let (chunks, _) = clicks_buf.as_chunks::<4>();
  let clicks: [(i32, i32); CAPTCHA_NUM] = std::array::from_fn(|i| {
    (
      u16::from_le_bytes([chunks[i][0], chunks[i][1]]) as i32,
      u16::from_le_bytes([chunks[i][2], chunks[i][3]]) as i32,
    )
  });

  let key = captcha_key(id_bytes);

  let pos_bytes: Option<Vec<u8>> = R.get(&key[..]).await.ok().flatten();

  if let Some(bytes) = pos_bytes
    && !bytes.is_empty()
    && let Ok(positions) = bitcode::decode::<Vec<(i32, i32, u32)>>(&bytes)
    && svg_captcha::verify(&clicks, &positions)
  {
    let _: () = R
      .set(
        &key[..],
        &[][..],
        Some(Expiration::EX(EXPIRE_S)),
        None,
        false,
      )
      .await?;
    return OK;
  }

  ERR
}
