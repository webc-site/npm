use axum::extract::Path;
use fred::interfaces::SortedSetsInterface;
use sonic_rs::Serialize;
use xkv::R;

use super::Host;
use crate::{api::Result, r::DOMAIN_USER};

const PAGE_SIZE: isize = 50;

#[derive(Serialize)]
pub struct UserList {
  pub total: u64,
  pub page: usize,
  pub list: Vec<String>,
}

pub async fn get_by_host(host: Host) -> Result<axum::Json<UserList>> {
  get_user_list(&host.0, 1).await
}

pub async fn get_by_page(
  Path((host, page)): Path<(String, usize)>,
) -> Result<axum::Json<UserList>> {
  get_user_list(&host, page).await
}

async fn get_user_list(host: &str, page: usize) -> Result<axum::Json<UserList>> {
  let page = page.max(1);
  let start = ((page - 1) * (PAGE_SIZE as usize)) as isize;
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

  Ok(axum::Json(UserList { total, page, list }))
}
