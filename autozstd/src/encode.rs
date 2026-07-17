use std::{cell::RefCell, io::Cursor};

use zstd::{
  bulk::Compressor,
  zstd_safe::{CParameter, FrameFormat, compress_bound},
};

use crate::{Result, Type};

/// Default compression level (6).
pub const DEFAULT_LEVEL: i32 = 6;

thread_local! {
  static COMPRESSOR: RefCell<Option<Compressor<'static>>> = const { RefCell::new(None) };
}

/// Compress data with an optional compression level.
/// If `level` is `None`, `DEFAULT_LEVEL` is used.
pub fn encode(data: &[u8], level: Option<i32>) -> Result<Vec<u8>> {
  if data.is_empty() {
    return Ok(vec![Type::Raw as u8]);
  }

  let level = level.unwrap_or(DEFAULT_LEVEL);
  let max_comp_len = compress_bound(data.len());
  let mut out = Vec::with_capacity(1 + max_comp_len);
  out.push(Type::Zstd as u8);

  let mut out = COMPRESSOR.with_borrow_mut(|opt| -> Result<Vec<u8>> {
    let compressor = if let Some(c) = opt {
      c
    } else {
      let mut c = Compressor::new(DEFAULT_LEVEL)?;
      c.set_parameter(CParameter::Format(FrameFormat::Magicless))?;
      opt.insert(c)
    };

    compressor.set_parameter(CParameter::CompressionLevel(level))?;

    let mut cursor = Cursor::new(out);
    cursor.set_position(1);
    compressor.compress_to_buffer(data, &mut cursor)?;
    Ok(cursor.into_inner())
  })?;

  let payload_len = out.len() - 1;

  if payload_len < data.len() {
    Ok(out)
  } else {
    out.clear();
    out.push(Type::Raw as u8);
    out.extend_from_slice(data);
    Ok(out)
  }
}
