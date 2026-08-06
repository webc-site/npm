use axum::extract::Path;
use fred::{interfaces::KeysInterface, interfaces::SetsInterface};
use xkv::R;

use crate::api::{Error, Result};
use crate::r::{DOMAIN_HOST, DOMAIN_USER, HOST_DKIM, HOST_DKIM_KEY, USER};

pub async fn rm(Path(email): Path<String>) -> Result<()> {
  let email = email.trim().to_lowercase();
  let Some((prefix, domain)) = email.split_once('@') else {
    return Err(Error::BadRequest);
  };
  if prefix.is_empty() || domain.is_empty() {
    return Err(Error::BadRequest);
  }

  let domain_bytes = domain.as_bytes();
  let prefix_bytes = prefix.as_bytes();

  let user_key = [USER, domain_bytes, b":", prefix_bytes].concat();
  let domain_user_key = [DOMAIN_USER, domain_bytes].concat();
  let domain_key = [DOMAIN_HOST, domain_bytes].concat();

  let pipeline = R.pipeline();
  let _ = pipeline.del::<(), _>(&user_key[..]);
  let _ = pipeline.srem::<(), _, _>(&domain_user_key[..], prefix_bytes);
  let _: () = pipeline.all().await?;

  let count: u64 = R.scard(&domain_user_key[..]).await.unwrap_or(0);
  if count == 0 {
    if let Some(id_bytes) = R.get::<Option<Vec<u8>>, _>(&domain_key[..]).await.ok().flatten() {
      let host_dkim_key = [HOST_DKIM, &id_bytes[..]].concat();
      let host_dkim_key_key = [HOST_DKIM_KEY, &id_bytes[..]].concat();
      let _: () = R
        .del((
          &domain_key[..],
          &domain_user_key[..],
          &host_dkim_key[..],
          &host_dkim_key_key[..],
        ))
        .await?;
    } else {
      let _: () = R.del((&domain_key[..], &domain_user_key[..])).await?;
    }
  }

  Ok(())
}
