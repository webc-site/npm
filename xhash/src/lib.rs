use xxhash_rust::{
  const_xxh3::const_custom_default_secret,
  xxh3::{Xxh3, Xxh3Builder, xxh3_64_with_secret, xxh3_128_with_secret},
};

pub const SEED: u64 = 100000020240803;
pub const SECRET: [u8; 192] = const_custom_default_secret(SEED);
pub const HASH128_LEN: usize = 16;

pub fn hasher() -> Xxh3 {
  Xxh3Builder::new().with_secret(SECRET).build()
}

pub fn hash64(bin: impl AsRef<[u8]>) -> u64 {
  xxh3_64_with_secret(bin.as_ref(), &SECRET)
}

pub fn hash128(bin: impl AsRef<[u8]>) -> u128 {
  xxh3_128_with_secret(bin.as_ref(), &SECRET)
}

pub fn hash_len_concat(hash: u128, len: usize) -> Vec<u8> {
  let hash_bytes = hash.to_le_bytes();
  let val = len - HASH128_LEN;
  let val_bytes = val.to_le_bytes();
  let mut i = val_bytes.len();
  while i > 0 {
    if val_bytes[i - 1] != 0 {
      break;
    }
    i -= 1;
  }
  let len_slice = &val_bytes[..i];
  let mut out = Vec::with_capacity(hash_bytes.len() + len_slice.len());
  out.extend_from_slice(&hash_bytes);
  out.extend_from_slice(len_slice);
  out
}

#[cfg(feature = "xhash")]
pub fn xhash(bin: impl AsRef<[u8]>) -> Vec<u8> {
  let bin = bin.as_ref();
  let len = bin.len();
  if len > HASH128_LEN {
    return hash_len_concat(hash128(bin), len);
  }
  bin.into()
}

#[cfg(feature = "hasher")]
mod hasher;
#[cfg(feature = "hasher")]
pub use hasher::Hasher;

#[cfg(feature = "fs")]
pub mod fs;
#[cfg(feature = "hash_li")]
mod hash_li;

#[cfg(feature = "hash_li")]
pub use hash_li::HashLi;

#[cfg(feature = "b64")]
mod b64;

#[cfg(feature = "b64")]
pub use b64::b64;
