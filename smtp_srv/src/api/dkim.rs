use axum::{Json, extract::Path, http::StatusCode};
use fred::interfaces::KeysInterface;

use crate::r::DKIM_SK;

const SELECTOR: &str = "webc-site";

pub async fn get(Path(domain): Path<String>) -> Result<Json<[String; 2]>, StatusCode> {
  if domain.is_empty() {
    return Err(StatusCode::BAD_REQUEST);
  }

  let sk_bytes: Vec<u8> = match xkv::R.get(DKIM_SK).await.ok().flatten() {
    Some(s) => s,
    None => {
      let mut arr = [0u8; 32];
      getrandom::fill(&mut arr).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
      let _: Result<(), _> = xkv::R.set(DKIM_SK, &arr[..], None, None, false).await;
      arr.to_vec()
    }
  };

  let dkim = sk_dkim::Sk::new(&sk_bytes).dkim(SELECTOR, &domain);
  let txt = dkim.txt();

  Ok(Json([SELECTOR.to_string(), txt]))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_dkim_calc() {
    let sk_bytes = [1u8; 32];
    let domain = "example.com";
    let dkim = sk_dkim::Sk::new(&sk_bytes).dkim(SELECTOR, domain);
    let txt = dkim.txt();
    assert!(txt.starts_with("v=DKIM1; k=rsa; p="));
  }
}
