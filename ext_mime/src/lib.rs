#![cfg_attr(docsrs, feature(doc_cfg))]

mod ext_mime;
mod mime;

pub use ext_mime::EXT_MIME;
pub use mime::*;

#[inline]
pub fn ext(file_name: &str) -> &str {
  let bytes = file_name.as_bytes();
  let mut i = bytes.len();
  while i > 0 {
    i -= 1;
    let b = bytes[i];
    if b == b'.' {
      if i == 0 {
        return "";
      }
      let prev = bytes[i - 1];
      #[cfg(windows)]
      if prev == b'/' || prev == b'\\' {
        return "";
      }
      #[cfg(not(windows))]
      if prev == b'/' {
        return "";
      }
      return unsafe { std::str::from_utf8_unchecked(&bytes[i + 1..]) };
    }
    #[cfg(windows)]
    if b == b'/' || b == b'\\' {
      break;
    }
    #[cfg(not(windows))]
    if b == b'/' {
      break;
    }
  }
  ""
}

pub fn mime(file_name: &str) -> &'static str {
  let ext = ext(file_name);
  let len = ext.len();
  if len == 0 || len > 16 {
    return mime::APPLICATION_OCTET_STREAM;
  }

  let mut buf = [0u8; 16];
  for (dest, src) in buf.iter_mut().zip(ext.as_bytes()) {
    *dest = src.to_ascii_lowercase();
  }

  let ext_lower = unsafe { std::str::from_utf8_unchecked(&buf[..len]) };

  EXT_MIME
    .get(ext_lower)
    .copied()
    .unwrap_or(mime::APPLICATION_OCTET_STREAM)
}
