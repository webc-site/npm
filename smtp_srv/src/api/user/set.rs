use fred::{
  interfaces::{KeysInterface, SortedSetsInterface},
  types::SetOptions,
};
use intbin::to_bin;
use xkv::R;

use crate::{
  api::{Error, Result},
  r::{DOMAIN_HOST, DOMAIN_USER, HOST_ID, USER},
};

pub async fn set(prefix: &str, host: &str, password: &str) -> Result<()> {
  if password.is_empty() {
    return Err(Error::BadRequest);
  }

  let host_bytes = host.as_bytes();
  let domain_key = [DOMAIN_HOST, host_bytes].concat();

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

  let (salt, hash) = password_::hash(password);
  let mut val = [0u8; 48];
  val[..16].copy_from_slice(&salt);
  val[16..].copy_from_slice(&hash);

  let prefix_bytes = prefix.as_bytes();
  let user_key = [USER, host_bytes, b":", prefix_bytes].concat();
  let domain_user_key = [DOMAIN_USER, host_bytes].concat();

  let now_ts = ts_::sec() as f64;

  let pipeline = R.pipeline();
  let _ = pipeline.set::<(), _, _>(&user_key[..], &val[..], None, None, false);
  let _ = pipeline.zadd::<(), _, _, _>(
    &domain_user_key[..],
    None,
    None,
    false,
    false,
    (now_ts, prefix_bytes),
  );
  let _: () = pipeline.all().await?;

  Ok(())
}
