use axum::{http::header::CONTENT_TYPE, response::IntoResponse};
use uuid::Uuid;
use xkv::{
  R,
  fred::{interfaces::KeysInterface, types::Expiration},
};

use super::{CAPTCHA_H, CAPTCHA_NUM, CAPTCHA_W, EXPIRE_S};
use crate::{Result, captcha_key};

/// Generates a CAPTCHA image and stores positions to Redis/kvrocks.
pub async fn get() -> Result<impl IntoResponse> {
  let id = Uuid::new_v4();
  let id_bytes = id.into_bytes();

  let cap = svg_captcha::render(CAPTCHA_W, CAPTCHA_H, CAPTCHA_NUM)?;
  let pos_bytes = bitcode::encode(&cap.positions);

  let key = captcha_key(&id_bytes);

  let _: () = R
    .set(
      &key[..],
      &pos_bytes[..],
      Some(Expiration::EX(EXPIRE_S)),
      None,
      false,
    )
    .await?;

  let mut buf = Vec::with_capacity(16 + 16 + cap.webp.len());
  buf.extend_from_slice(&id_bytes);

  for icon in &cap.icons {
    vb::e(icon.len() as u64, &mut buf);
  }
  for icon in &cap.icons {
    buf.extend_from_slice(icon.as_bytes());
  }

  buf.extend_from_slice(&cap.webp);

  Ok(([(CONTENT_TYPE, "application/octet-stream")], buf))
}
