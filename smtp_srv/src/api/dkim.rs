use axum::{Json, extract::Path};
use fred::{interfaces::KeysInterface, types::SetOptions};
use xkv::R;

use super::{Error, Result};
use crate::r::{self, DKIM_SK};

const SELECTOR: &str = "webc-site";

pub async fn get(Path(domain): Path<String>) -> Result<Json<[String; 2]>> {
  if domain.is_empty() {
    return Err(Error::BadRequest);
  }

  // 获取或初始化全局 32 字节 DKIM 密钥种子 (smtpDkimSk)
  let sk_bytes: Vec<u8> = match R.get(DKIM_SK).await.ok().flatten() {
    Some(s) => s,
    None => {
      let mut arr = [0u8; 32];
      getrandom::fill(&mut arr)?;
      let set_nx = R
        .set::<(), _, _>(DKIM_SK, &arr[..], None, Some(SetOptions::NX), false)
        .await;
      if set_nx.is_ok() {
        arr.to_vec()
      } else {
        R.get::<Option<Vec<u8>>, _>(DKIM_SK)
          .await?
          .ok_or(Error::BadRequest)?
      }
    }
  };

  // 查询或分配域名的 host_id
  let host_id_bytes = r::get_or_alloc_host_id(&domain).await?;

  // 绑定 host_id 的 DKIM selector 供发信端调用
  let host_dkim_key = r::host_dkim_key(&host_id_bytes);
  if R
    .get::<Option<Vec<u8>>, _>(&host_dkim_key[..])
    .await
    .ok()
    .flatten()
    .is_none()
  {
    let _ = R
      .set::<(), _, _>(
        &host_dkim_key[..],
        SELECTOR,
        None,
        Some(SetOptions::NX),
        false,
      )
      .await;
  }

  // 实时派生 DKIM 密钥并导出 TXT 记录
  let dkim = sk_dkim::Sk::new(&sk_bytes).dkim(SELECTOR, &domain);
  let txt = dkim.txt();

  Ok(Json([SELECTOR.to_string(), txt]))
}
