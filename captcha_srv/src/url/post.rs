use std::result::Result as StdResult;

use axum::{body::Bytes, response::IntoResponse};
use xkv::{R, fred::interfaces::KeysInterface};

use super::{CAPTCHA_NUM, ERR, OK};
use crate::{Result, captcha_key};

/// Verifies clicked positions against stored CAPTCHA coordinates.
pub async fn post(body: Bytes) -> Result<impl IntoResponse> {
  if body.len() < 16 {
    return ERR;
  }

  let (id_bytes, clicks_buf) = body.split_at(16);
  let Ok(id_arr) = id_bytes.try_into() else {
    return ERR;
  };

  let (chunks, _) = clicks_buf.as_chunks::<4>();
  if chunks.len() != CAPTCHA_NUM {
    return ERR;
  }

  let mut clicks = [(0i32, 0i32); CAPTCHA_NUM];
  for (i, chunk) in chunks.iter().enumerate() {
    clicks[i] = (
      u16::from_le_bytes([chunk[0], chunk[1]]) as i32,
      u16::from_le_bytes([chunk[2], chunk[3]]) as i32,
    );
  }

  let key = captcha_key(id_arr);

  let pos_bytes: Option<Vec<u8>> = R.get(&key[..]).await.ok().flatten();

  if let Some(bytes) = pos_bytes {
    let _: StdResult<u32, _> = R.del(&key[..]).await;
    if let Ok(positions) = bitcode::decode::<Vec<(i32, i32, u32)>>(&bytes)
      && svg_captcha::verify(&clicks, &positions)
    {
      return OK;
    }
  }

  ERR
}
