pub struct Key(pub [u8; 32]);

impl<const N: usize> From<[u8; N]> for Key {
  #[inline]
  fn from(v: [u8; N]) -> Self {
    Self::from(&v)
  }
}

impl<const N: usize> From<&[u8; N]> for Key {
  #[inline]
  fn from(v: &[u8; N]) -> Self {
    if N == 32 {
      let mut key = [0u8; 32];
      key.copy_from_slice(v);
      Self(key)
    } else {
      Self(*blake3::hash(v).as_bytes())
    }
  }
}

impl From<&[u8]> for Key {
  #[inline]
  fn from(v: &[u8]) -> Self {
    if v.len() == 32 {
      let mut key = [0u8; 32];
      key.copy_from_slice(v);
      Self(key)
    } else {
      Self(*blake3::hash(v).as_bytes())
    }
  }
}

impl From<Vec<u8>> for Key {
  #[inline]
  fn from(v: Vec<u8>) -> Self {
    Self::from(v.as_slice())
  }
}

impl From<&str> for Key {
  #[inline]
  fn from(v: &str) -> Self {
    Self::from(v.as_bytes())
  }
}

impl From<String> for Key {
  #[inline]
  fn from(v: String) -> Self {
    Self::from(v.as_bytes())
  }
}
