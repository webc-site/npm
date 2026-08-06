use fred::interfaces::{KeysInterface, SortedSetsInterface};
use xkv::R;

use super::Email;
use crate::{
  api::Result,
  r::{DOMAIN_HOST, DOMAIN_USER, HOST_DKIM, HOST_DKIM_KEY, USER},
};

pub async fn rm(email: Email) -> Result<()> {
  let host_bytes = email.host.as_bytes();
  let prefix_bytes = email.prefix.as_bytes();

  let user_key = [USER, host_bytes, b":", prefix_bytes].concat();
  let domain_user_key = [DOMAIN_USER, host_bytes].concat();
  let domain_key = [DOMAIN_HOST, host_bytes].concat();

  let pipeline = R.pipeline();
  let _ = pipeline.del::<(), _>(&user_key[..]);
  let _ = pipeline.zrem::<(), _, _>(&domain_user_key[..], prefix_bytes);
  let _: () = pipeline.all().await?;

  let count: u64 = R.zcard(&domain_user_key[..]).await.unwrap_or(0);
  if count == 0 {
    if let Some(id_bytes) = R
      .get::<Option<Vec<u8>>, _>(&domain_key[..])
      .await
      .ok()
      .flatten()
    {
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
