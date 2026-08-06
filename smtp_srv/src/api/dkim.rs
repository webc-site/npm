use axum::{Json, extract::Path, http::StatusCode};
use fred::interfaces::KeysInterface;
use xkv::R;

use crate::r::DKIM_SK;

const SELECTOR: &str = "webc-site";

pub async fn get(Path(domain): Path<String>) -> Result<Json<[String; 2]>, StatusCode> {
  if domain.is_empty() {
    return Err(StatusCode::BAD_REQUEST);
  }

  let sk_bytes: Vec<u8> = match R.get(DKIM_SK).await.ok().flatten() {
    Some(s) => s,
    None => {
      let mut arr = [0u8; 32];
      getrandom::fill(&mut arr).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
      let _: Result<(), _> = R.set(DKIM_SK, &arr[..], None, None, false).await;
      arr.to_vec()
    }
  };

  let dkim = sk_dkim::Sk::new(&sk_bytes).dkim(SELECTOR, &domain);
  let txt = dkim.txt();

  Ok(Json([SELECTOR.to_string(), txt]))
}
