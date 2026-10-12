use base64::engine::{Engine as _, general_purpose::URL_SAFE_NO_PAD};
use bytes::Bytes;
use reqer::Client;
use serde::{Deserialize, Serialize};

use crate::{
  Error, Result,
  cbor::{decode, encode},
  consts::{ACCEPT, APPLICATION_CBOR, CONTENT_TYPE, SIGNIN},
};

// 提前 60 秒判定 token 过期
const EXPIRY_MARGIN: u64 = 60;

#[derive(Debug, Clone, Default)]
pub(crate) struct TokenState {
  pub(crate) token: String,
  pub(crate) header: String,
  pub(crate) expire_at: u64,
}

#[derive(Serialize)]
struct AuthParams<'a> {
  user: &'a str,
  pass: &'a str,
  #[serde(skip_serializing_if = "Option::is_none")]
  ns: Option<&'a str>,
}

#[derive(Serialize)]
struct RpcSigninReq<'a> {
  id: &'a str,
  method: &'a str,
  params: [AuthParams<'a>; 1],
}

#[derive(Deserialize)]
struct RpcSigninRes {
  result: Option<String>,
  error: Option<RpcErrObj>,
}

#[derive(Deserialize, Debug)]
struct RpcErrObj {
  message: String,
}

#[derive(Deserialize)]
struct JwtPayload {
  #[serde(default)]
  exp: u64,
}

pub(crate) fn token_exp(token: &str) -> Result<u64> {
  let (_, rest) = token.split_once('.').ok_or(Error::JwtDecode)?;
  let payload_b64 = rest.split_once('.').map_or(rest, |(p, _)| p);
  let unpadded = payload_b64.trim_end_matches('=');
  let mut buf = [0u8; 1024];
  let heap_buf;
  let bin = if (unpadded.len() * 3).div_ceil(4) <= buf.len() {
    let len = URL_SAFE_NO_PAD
      .decode_slice(unpadded.as_bytes(), &mut buf)
      .map_err(|_| Error::JwtDecode)?;
    &buf[..len]
  } else {
    heap_buf = URL_SAFE_NO_PAD
      .decode(unpadded)
      .map_err(|_| Error::JwtDecode)?;
    &heap_buf[..]
  };

  let payload: JwtPayload = sonic_rs::from_slice(bin)?;
  Ok(payload.exp)
}

pub(crate) async fn signin(
  http: &Client,
  rpc_url: &str,
  user: &str,
  pass: &str,
  ns: Option<&str>,
) -> Result<(String, String, u64)> {
  let req_body: Bytes = encode(&RpcSigninReq {
    id: SIGNIN,
    method: SIGNIN,
    params: [AuthParams { user, pass, ns }],
  })?
  .into();

  let mut last_err = None;
  for _ in 0..3 {
    let req = http
      .post(rpc_url)
      .header(CONTENT_TYPE, APPLICATION_CBOR)
      .header(ACCEPT, APPLICATION_CBOR)
      .body(req_body.clone());

    match req.send().await {
      Ok(resp) => {
        let bytes = resp.bytes().await?;
        let data: RpcSigninRes = decode(&bytes)?;
        if let Some(err) = data.error {
          return Err(Error::Rpc(err.message));
        }
        if let Some(token) = data.result {
          let exp = token_exp(&token).unwrap_or(0);
          let expire_at = exp.saturating_sub(EXPIRY_MARGIN);
          let bearer = format!("Bearer {token}");
          return Ok((token, bearer, expire_at));
        }
        return Err(Error::Rpc("signin failed: empty result".to_string()));
      }
      Err(e) => {
        last_err = Some(e);
      }
    }
  }

  match last_err {
    Some(e) => Err(Error::Http(e)),
    None => Err(Error::Rpc("signin failed: retry exhausted".to_string())),
  }
}
