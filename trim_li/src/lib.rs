#![cfg_attr(docsrs, feature(doc_cfg))]

use core::str::from_utf8_unchecked;

use hipstr::HipStr;
use memchr::memchr2;
use roaring::RoaringBitmap;

mod restore;
pub use restore::Restore;

/// 非空行字符串列表类型别名。
pub type Li<'a> = Vec<HipStr<'a>>;

/// 默认估计的平均行长度，用于预估分配容量。
const ESTIMATED_LINE_LEN: usize = 40;
/// 最小分配容量。
const MIN_CAP: usize = 8;

#[inline]
fn trim_end_space_tab(s: &str) -> &str {
  let bytes = s.as_bytes();
  if let Some(pos) = bytes.iter().rposition(|&b| b != b' ' && b != b'\t') {
    let mut trimmed = unsafe { s.get_unchecked(..=pos) };
    let last_byte = unsafe { *bytes.get_unchecked(pos) };
    if (last_byte > 0x7F || last_byte == 0x0B || last_byte == 0x0C)
      && trimmed.ends_with(char::is_whitespace)
    {
      trimmed = trimmed.trim_end();
    }
    trimmed
  } else {
    ""
  }
}

/// 过滤空行并修剪行尾空白的高性能函数。
/// 返回 `Restore` 结构体和无空行的 `Li<'_>`。
#[inline]
pub fn trim_li(txt: &str) -> (Restore, Li<'_>) {
  let len = txt.len();
  if len == 0 {
    return (Restore::default(), Vec::new());
  }

  let bytes = txt.as_bytes();
  let cap = (len / ESTIMATED_LINE_LEN).max(MIN_CAP);
  let mut bitmap = RoaringBitmap::new();
  let mut li = Vec::with_capacity(cap);
  let mut pos = 0;
  let mut line_idx = 0u32;

  while pos < len {
    let remaining = unsafe { bytes.get_unchecked(pos..) };
    let offset = memchr2(b'\n', b'\r', remaining).unwrap_or(remaining.len());
    let end = pos + offset;

    let next_pos = if offset < remaining.len() {
      if unsafe { *remaining.get_unchecked(offset) == b'\r' }
        && offset + 1 < remaining.len()
        && unsafe { *remaining.get_unchecked(offset + 1) == b'\n' }
      {
        end + 2
      } else {
        end + 1
      }
    } else {
      end
    };

    let line_bytes = unsafe { bytes.get_unchecked(pos..end) };
    let line_str = unsafe { from_utf8_unchecked(line_bytes) };
    let trimmed = trim_end_space_tab(line_str);

    if !trimmed.is_empty() {
      bitmap.insert(line_idx);
      li.push(HipStr::borrowed(trimmed));
    }

    line_idx += 1;
    pos = next_pos;
  }

  (Restore { bitmap }, li)
}
