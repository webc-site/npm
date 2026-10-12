use xxhash_rust::xxh3::Xxh3;

use crate::{HASH128_LEN, hash_len_concat};

pub struct Hasher {
  hasher: Xxh3,
  buf: [u8; HASH128_LEN],
  pub len: usize,
}

impl Default for Hasher {
  fn default() -> Self {
    Self::new()
  }
}

impl Hasher {
  pub fn new() -> Self {
    Self {
      hasher: crate::hasher(),
      buf: [0; HASH128_LEN],
      len: 0,
    }
  }

  pub fn write(&mut self, bytes: impl AsRef<[u8]>) {
    let bytes = bytes.as_ref();
    if bytes.is_empty() {
      return;
    }

    let old_len = self.len;
    self.len += bytes.len();

    if self.len > HASH128_LEN {
      if old_len <= HASH128_LEN {
        if old_len > 0 {
          self.hasher.update(&self.buf[..old_len]);
        }
        self.hasher.update(bytes);
      } else {
        self.hasher.update(bytes);
      }
    } else {
      self.buf[old_len..self.len].copy_from_slice(bytes);
    }
  }

  pub fn finish(self) -> Vec<u8> {
    if self.len > HASH128_LEN {
      return hash_len_concat(self.hasher.digest128(), self.len);
    }
    self.buf[..self.len].to_vec()
  }

  pub fn iter<Ref: AsRef<[u8]>>(iter: impl IntoIterator<Item = Ref>) -> Vec<u8> {
    let mut hasher = Self::new();
    for i in iter {
      hasher.write(i);
    }
    hasher.finish()
  }
}
