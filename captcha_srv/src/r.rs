/// Redis/kvrocks key prefix for captcha data.
pub const R_CAPTCHA: &[u8] = b"captcha:";

/// Generates Redis key from UUID bytes without heap allocation.
#[inline]
pub fn captcha_key(id_bytes: &[u8; 16]) -> [u8; 24] {
  let mut key = [0u8; 24];
  let prefix_len = R_CAPTCHA.len();
  key[..prefix_len].copy_from_slice(R_CAPTCHA);
  key[prefix_len..].copy_from_slice(id_bytes);
  key
}
