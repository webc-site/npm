use fred::interfaces::{KeysInterface, SortedSetsInterface};
use xkv::R;

use crate::{
  api::{Result, extractor::Email},
  r,
};

pub async fn rm(email: Email) -> Result<()> {
  let host = email.host.as_str();
  let prefix = email.prefix.as_str();

  let user_key = r::user_key(host, prefix);
  let domain_user_key = r::domain_user_key(host);
  let domain_key = r::domain_key(host);

  let pipeline = R.pipeline();
  drop(pipeline.del::<(), _>(&user_key[..]));
  drop(pipeline.zrem::<(), _, _>(&domain_user_key[..], prefix));
  let _: () = pipeline.all().await?;

  let count: u64 = R.zcard(&domain_user_key[..]).await.unwrap_or(0);
  if count == 0 {
    if let Some(id_bytes) = R
      .get::<Option<Vec<u8>>, _>(&domain_key[..])
      .await
      .ok()
      .flatten()
    {
      let host_dkim_key = r::host_dkim_key(&id_bytes);
      let host_dkim_key_key = r::host_dkim_private_key(&id_bytes);
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
