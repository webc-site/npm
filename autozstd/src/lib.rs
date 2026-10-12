#![cfg_attr(docsrs, feature(doc_cfg))]

mod error;
pub use error::{Error, Result};

mod encode;
pub use encode::{DEFAULT_LEVEL, encode};

mod decode;
pub use decode::decode;

/// The compression type indicator.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Type {
  /// Raw uncompressed data
  Raw = 0,
  /// Zstd compressed data (without magic number)
  Zstd = 1,
}

impl TryFrom<u8> for Type {
  type Error = Error;

  #[inline]
  fn try_from(value: u8) -> Result<Self> {
    match value {
      0 => Ok(Self::Raw),
      1 => Ok(Self::Zstd),
      _ => Err(Error::InvalidType(value)),
    }
  }
}
