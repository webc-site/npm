use fred::{interfaces::KeysInterface, interfaces::SetsInterface, types::SetOptions};
use intbin::to_bin;
use xkv::R;

use crate::api::{Error, Result};
use crate::r::{DOMAIN_HOST, DOMAIN_USER, HOST_ID, USER};

pub async fn set(email: &str, password: &str) -> Result<()> {
  if password.is_empty() {
    return Err(Error::BadRequest);
  }
  let email = email.trim().to_lowercase();
  let Some((prefix, domain)) = email.split_once('@') else {
    return Err(Error::BadRequest);
  };
  if prefix.is_empty() || domain.is_empty() {
    return Err(Error::BadRequest);
  }

  let domain_key = [DOMAIN_HOST, domain.as_bytes()].concat();
  let _host_id_bytes: Vec<u8> = match R.get(&domain_key[..]).await.ok().flatten() {
    Some(id) => id,
    None => {
      let host_id: u64 = R.incr(HOST_ID).await?;
      let id_bytes = to_bin(host_id);
      let _ = R.set::<(), _, _>(
        &domain_key[..],
        id_bytes.as_ref(),
        None,
        Some(SetOptions::NX),
        false,
      )
      .await;
      if let Some(id) = R.get(&domain_key[..]).await.ok().flatten() {
        id
      } else {
        id_bytes.to_vec()
      }
    }
  };

  let (salt, hash) = password_::hash(password);
  let val = [&salt[..], &hash[..]].concat();

  let user_key = [USER, domain.as_bytes(), b":", prefix.as_bytes()].concat();
  let domain_user_key = [DOMAIN_USER, domain.as_bytes()].concat();

  let pipeline = R.pipeline();
  let _ = pipeline.set::<(), _, _>(&user_key[..], &val[..], None, None, false);
  let _ = pipeline.sadd::<(), _, _>(&domain_user_key[..], prefix.as_bytes());
  let _: () = pipeline.all().await?;

  Ok(())
}
