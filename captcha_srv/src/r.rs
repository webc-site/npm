/// Redis/kvrocks key prefix for captcha data.
pub const R_CAPTCHA: &[u8] = b"captcha:";

/// Generates Redis key from UUID bytes without heap allocation.
#[inline]
pub const fn captcha_key(id_bytes: &[u8; 16]) -> [u8; 24] {
  let mut key = [0u8; 24];
  let mut i = 0;
  while i < 8 {
    key[i] = R_CAPTCHA[i];
    i += 1;
  }
  while i < 16 {
    key[i + 8] = id_bytes[i];
    i += 1;
  }
  key
}

