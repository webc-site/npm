use axum::{extract::Path, response::IntoResponse};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use xkv::{R, fred::interfaces::KeysInterface};

use super::{ERR, OK};
use crate::{Result, captcha_key};

/// Helper to parse token from string (Base64URL).
fn parse_token(token: &str) -> Option<[u8; 16]> {
  if let Ok(bytes) = URL_SAFE_NO_PAD.decode(token)
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
