use fred::{
  interfaces::{KeysInterface, SortedSetsInterface},
  types::SetOptions,
};
use intbin::to_bin;
use xkv::R;

use crate::{
  api::{Error, Result, extractor::Json},
  r::{self, HOST_ID},
};

pub async fn set(Json([email, password]): Json<[String; 2]>) -> Result<()> {
  if password.is_empty() {
    return Err(Error::BadRequest);
  }

  let email = email.trim().to_lowercase();
  let Some((prefix, host)) = email.split_once('@') else {
    return Err(Error::BadRequest);
  };
  if prefix.is_empty() || host.is_empty() {
    return Err(Error::BadRequest);
  }

  let domain_key = r::domain_key(host);

  if R
    .get::<Option<Vec<u8>>, _>(&domain_key[..])
    .await
    .ok()
    .flatten()
    .is_none()
  {
    let host_id: u64 = R.incr(HOST_ID).await?;
    let id_bytes = to_bin(host_id);
    let _ = R
      .set::<(), _, _>(
        &domain_key[..],
        id_bytes.as_ref(),
        None,
        Some(SetOptions::NX),
        false,
      )
      .await;
  }

  let (salt, hash) = password_::hash(&password);
  let mut val = [0u8; 48];
  val[..16].copy_from_slice(&salt);
  val[16..].copy_from_slice(&hash);

  let user_key = r::user_key(host, prefix);
  let domain_user_key = r::domain_user_key(host);

  let now_ts = ts_::sec() as f64;

  let pipeline = R.pipeline();
  drop(pipeline.set::<(), _, _>(&user_key[..], &val[..], None, None, false));
  drop(pipeline.zadd::<(), _, _>(
    &domain_user_key[..],
    None,
    None,
    false,
    false,
    (now_ts, prefix.as_bytes()),
  ));
  let _: () = pipeline.all().await?;

  Ok(())
}
