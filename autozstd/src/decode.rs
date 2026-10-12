use std::cell::RefCell;

use zstd::{
  bulk::Decompressor,
  zstd_safe::{DParameter, FrameFormat},
};

use crate::{Error, Result};

thread_local! {
  static DECOMPRESSOR: RefCell<Option<Decompressor<'static>>> = const { RefCell::new(None) };
}

/// Decompress data encoded by autozstd using native magicless zstd format.
pub fn decode(data: &[u8]) -> Result<Vec<u8>> {
  if data.is_empty() {
    return Err(Error::Empty);
  }
  let payload = unsafe { data.get_unchecked(1..) };
  match unsafe { *data.get_unchecked(0) } {
    0 => Ok(payload.to_vec()),
    1 => {
      let mut capacity = payload.len().saturating_mul(4).max(4096);
      DECOMPRESSOR.with_borrow_mut(|opt| -> Result<Vec<u8>> {
        let decompressor = if let Some(d) = opt {
          d
        } else {
          let mut d = Decompressor::new()?;
          d.set_parameter(DParameter::Format(FrameFormat::Magicless))?;
          opt.insert(d)
        };

        loop {
          let mut decompressed = Vec::with_capacity(capacity);
          match decompressor.decompress_to_buffer(payload, &mut decompressed) {
            Ok(_) => return Ok(decompressed),
            Err(e) => {
              let err_msg = e.to_string();
              if err_msg.contains("too small")
                || err_msg.contains("Destination buffer is too small")
              {
                if capacity >= 1024 * 1024 * 1024 {
                  return Err(Error::Zstd(e));
                }
                capacity = capacity.saturating_mul(2);
              } else {
                return Err(Error::Zstd(e));
              }
            }
          }
        }
      })
    }
    other => Err(Error::InvalidType(other)),
  }
}
