use fred::interfaces::{KeysInterface, SortedSetsInterface};
use xkv::R;

use xmail::norm_user_host;

use crate::{
  api::{Error, Result, extractor::Json},
  r,
};

pub async fn set(Json([email, password]): Json<[String; 2]>) -> Result<()> {
  let Some((prefix, host)) = (!password.is_empty()).then_some(&email).and_then(norm_user_host) else {
    return Err(Error::BadRequest);
  };

  let _ = r::get_or_alloc_host_id(&host).await?;

  let (salt, hash) = password_::hash(&password);
  let mut val = [0u8; 48];
  val[..16].copy_from_slice(&salt);
  val[16..].copy_from_slice(&hash);

  let user_key = r::user_key(&host, &prefix);
  let domain_user_key = r::domain_user_key(&host);

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
