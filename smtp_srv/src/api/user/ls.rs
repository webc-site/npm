use axum::{Json, extract::Path};
use fred::interfaces::SortedSetsInterface;
use sonic_rs::Serialize;
use xkv::R;

use crate::{
  api::{Result, extractor::Host},
  r::DOMAIN_USER,
};

const PAGE_SIZE: i64 = 50;

#[derive(Serialize)]
pub struct UserList {
  pub total: u64,
  pub page: usize,
  pub list: Vec<String>,
}

pub async fn by_host(host: Host) -> Result<Json<UserList>> {
  ls(&host.0, 1).await
}

pub async fn by_page(Path((host, page)): Path<(String, usize)>) -> Result<Json<UserList>> {
  ls(&host, page).await
}

async fn ls(host: &str, page: usize) -> Result<Json<UserList>> {
  let page = page.max(1);
  let start = (page - 1) as i64 * PAGE_SIZE;
  let stop = start + PAGE_SIZE - 1;

  let domain_user_key = [DOMAIN_USER, host.as_bytes()].concat();

  let (total, list): (u64, Vec<String>) = tokio::try_join!(
    async { Ok(R.zcard(&domain_user_key[..]).await.unwrap_or(0)) },
    async {
      Ok(
        R.zrevrange(&domain_user_key[..], start, stop, false)
          .await
          .unwrap_or_default(),
      )
    }
  )?;

  Ok(Json(UserList { total, page, list }))
}
