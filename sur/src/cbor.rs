use ciborium::{de::from_reader, ser::into_writer};
use serde::{Serialize, de::DeserializeOwned};

use crate::Result;

#[inline]
pub(crate) fn encode<T: Serialize + ?Sized>(val: &T) -> Result<Vec<u8>> {
  let mut buf = Vec::with_capacity(128);
  into_writer(val, &mut buf)?;
  Ok(buf)
}

#[inline]
pub(crate) fn decode<T: DeserializeOwned>(bytes: &[u8]) -> Result<T> {
  Ok(from_reader(bytes)?)
}
