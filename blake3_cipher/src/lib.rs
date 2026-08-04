#![cfg_attr(docsrs, feature(doc_cfg))]

#[cfg(feature = "dec")]
mod dec;
#[cfg(feature = "enc")]
mod enc;
mod key;

pub use key::Key;

pub struct Cipher {
  pub key: Key,
}

impl Cipher {
  pub fn new(key: impl Into<Key>) -> Self {
    Self { key: key.into() }
  }

  #[cfg(any(feature = "dec", feature = "enc"))]
  #[inline]
  pub(crate) fn xor_in_place(&self, nonce: impl AsRef<[u8]>, data: &mut [u8]) {
    let mut stream_output = blake3::Hasher::new_keyed(&self.key.0)
      .update(nonce.as_ref())
      .finalize_xof();
    xof_xor(&mut stream_output, STREAM_SEEK, data);
  }
}

pub(crate) const BLOCK_LEN: usize = 64;
pub(crate) const STREAM_SEEK: u64 = 1 << 63;

#[inline]
pub(crate) fn xor(dest: &mut [u8], other: &[u8]) {
  debug_assert_eq!(dest.len(), other.len());
  for (d, o) in dest.iter_mut().zip(other.iter()) {
    *d ^= *o;
  }
}

pub(crate) fn xof_xor(output: &mut blake3::OutputReader, seek: u64, dest: &mut [u8]) {
  debug_assert_eq!(0, seek % BLOCK_LEN as u64);
  output.set_position(seek);
  const BUF_LEN: usize = 2048;
  let mut buf = [0u8; BUF_LEN];
  let chunks = dest.chunks_mut(BUF_LEN);
  for chunk in chunks {
    let len = chunk.len();
    output.fill(&mut buf[..len]);
    xor(chunk, &buf[..len]);
  }
}
