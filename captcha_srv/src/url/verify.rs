use axum::{extract::Path, response::IntoResponse};
use b64::FromBase64;
use xkv::{R, fred::interfaces::KeysInterface};

use super::{ERR, OK};
use crate::{Result, captcha_key};

/// Helper to parse token from string (Base64 / Base64URL).
fn parse_token(token: &str) -> Option<[u8; 16]> {
  if let Ok(bytes) = token.from_base64()
    && bytes.len() == 16
  {
    return bytes.try_into().ok();
  }
  None
}

/// Verifies token for backend servers via GET /verify/{token}, deletes key if valid.
pub async fn verify(Path(token): Path<String>) -> Result<impl IntoResponse> {
  let Some(id_bytes) = parse_token(&token) else {
    return ERR;
  };
  let key = captcha_key(&id_bytes);

  let pos_bytes: Option<Vec<u8>> = R.getdel(&key[..]).await.ok().flatten();

  if let Some(bytes) = pos_bytes
    && bytes.is_empty()
  {
    return OK;
  }

  ERR
}
