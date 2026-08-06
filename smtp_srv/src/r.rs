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

pub fn domain_key(domain: impl AsRef<[u8]>) -> Vec<u8> {
  [DOMAIN_HOST, domain.as_ref()].concat()
}

pub fn user_key(domain: impl AsRef<[u8]>, prefix: impl AsRef<[u8]>) -> Vec<u8> {
  [USER, domain.as_ref(), b":", prefix.as_ref()].concat()
}

pub fn domain_user_key(domain: impl AsRef<[u8]>) -> Vec<u8> {
  [DOMAIN_USER, domain.as_ref()].concat()
}

pub fn host_dkim_key(host_id_bytes: &[u8]) -> Vec<u8> {
  [HOST_DKIM, host_id_bytes].concat()
}

pub fn host_dkim_private_key(host_id_bytes: &[u8]) -> Vec<u8> {
  [HOST_DKIM_KEY, host_id_bytes].concat()
}
