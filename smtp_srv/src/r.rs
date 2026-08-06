use fred::{interfaces::KeysInterface, types::SetOptions};
use intbin::to_bin;
use xkv::R;

pub const MAIL_FORWARD: &str = "mailForward";
pub const MAIL_FORWARD_SET: &str = "mailForwardSet";

// smtpDomainHost:${domain} -> host_id (varint 编码字节, u64)
pub const DOMAIN_HOST: &[u8] = b"smtpDomainHost:";

// smtpUser:${domain}:${prefix} -> salt(16B) + argon2id_hash(32B) = 48B
pub const USER: &[u8] = b"smtpUser:";

// smtpDomainUser:${domain} -> ZSet<prefix, timestamp> 域名下邮箱前缀有序集合 (Score 为秒级时间戳)
pub const DOMAIN_USER: &[u8] = b"smtpDomainUser:";

// smtpHostDkim:${host_id_bytes} -> selector 字符串
pub const HOST_DKIM: &[u8] = b"smtpHostDkim:";

// smtpHostDkimKey:${host_id_bytes} -> DKIM 私钥字节
pub const HOST_DKIM_KEY: &[u8] = b"smtpHostDkimKey:";

// 全局 DKIM 密钥种子 (32B)
pub const DKIM_SK: &str = "smtpDkimSk";

// host_id 自增计数器 (u64)
pub const HOST_ID: &str = "smtpHostId";

#[inline]
pub fn domain_key(domain: impl AsRef<[u8]>) -> Vec<u8> {
  let domain = domain.as_ref();
  let mut v = Vec::with_capacity(DOMAIN_HOST.len() + domain.len());
  v.extend_from_slice(DOMAIN_HOST);
  v.extend_from_slice(domain);
  v
}

#[inline]
pub fn user_key(domain: impl AsRef<[u8]>, prefix: impl AsRef<[u8]>) -> Vec<u8> {
  let domain = domain.as_ref();
  let prefix = prefix.as_ref();
  let mut v = Vec::with_capacity(USER.len() + domain.len() + 1 + prefix.len());
  v.extend_from_slice(USER);
  v.extend_from_slice(domain);
  v.push(b':');
  v.extend_from_slice(prefix);
  v
}

#[inline]
pub fn domain_user_key(domain: impl AsRef<[u8]>) -> Vec<u8> {
  let domain = domain.as_ref();
  let mut v = Vec::with_capacity(DOMAIN_USER.len() + domain.len());
  v.extend_from_slice(DOMAIN_USER);
  v.extend_from_slice(domain);
  v
}

#[inline]
pub fn host_dkim_key(host_id_bytes: &[u8]) -> Vec<u8> {
  let mut v = Vec::with_capacity(HOST_DKIM.len() + host_id_bytes.len());
  v.extend_from_slice(HOST_DKIM);
  v.extend_from_slice(host_id_bytes);
  v
}

#[inline]
pub fn host_dkim_private_key(host_id_bytes: &[u8]) -> Vec<u8> {
  let mut v = Vec::with_capacity(HOST_DKIM_KEY.len() + host_id_bytes.len());
  v.extend_from_slice(HOST_DKIM_KEY);
  v.extend_from_slice(host_id_bytes);
  v
}

pub async fn get_or_alloc_host_id(domain: &str) -> aok::Result<Vec<u8>> {
  let domain_key = domain_key(domain);
  if let Some(id) = R.get::<Option<Vec<u8>>, _>(&domain_key[..]).await.ok().flatten() {
    return Ok(id);
  }
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
  Ok(id_bytes.to_vec())
}
