use axum::{body::Bytes, response::IntoResponse};
use xkv::{R, fred::interfaces::KeysInterface};

use super::{CAPTCHA_NUM, ERR, OK};
use crate::{Result, captcha_key};

/// Verifies clicked positions against stored CAPTCHA coordinates.
pub async fn post(body: Bytes) -> Result<impl IntoResponse> {
  let Some((id_bytes, clicks_buf)) = body.split_first_chunk::<16>() else {
    return ERR;
  };

  if clicks_buf.len() != CAPTCHA_NUM * 4 {
    return ERR;
  }

  let mut clicks = [(0i32, 0i32); CAPTCHA_NUM];
  for (i, chunk) in clicks_buf.chunks_exact(4).enumerate() {
    clicks[i] = (
      u16::from_le_bytes([chunk[0], chunk[1]]) as i32,
      u16::from_le_bytes([chunk[2], chunk[3]]) as i32,
    );
  }

  let key = captcha_key(id_bytes);

  let pos_bytes: Option<Vec<u8>> = R.getdel(&key[..]).await.ok().flatten();

  if let Some(bytes) = pos_bytes
    && let Ok(positions) = bitcode::decode::<Vec<(i32, i32, u32)>>(&bytes)
    && svg_captcha::verify(&clicks, &positions)
  {
    return OK;
  }


  ERR
}

