use hipstr::HipStr;
use roaring::RoaringBitmap;

/// 用于还原文本的控制信息结构体。
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Restore {
  /// 存储非空行在原始文本中的行索引（从0开始）。
  /// 故 `bitmap.len()` 即为非空行的总数量。
  pub bitmap: RoaringBitmap,
}

impl Restore {
  /// 还原文本，统一以 `\n` 换行。若传入的 `lines` 长度与最初的非空行数量不一致，返回 `None`。
  #[inline]
  pub fn load<S: AsRef<str>>(&self, lines: &[S]) -> Option<HipStr<'static>> {
    let expected_len = self.bitmap.len();
    if lines.len() as u64 != expected_len {
      return None;
    }

    let total_lines = if self.bitmap.is_empty() {
      0
    } else {
      (unsafe { self.bitmap.max().unwrap_unchecked() } as usize) + 1
    };

    let lines_len: usize = lines.iter().map(|s| s.as_ref().len()).sum();
    let newlines_len = total_lines.saturating_sub(1);
    let total_len = lines_len + newlines_len;

    let mut out: Vec<u8> = Vec::with_capacity(total_len);
    let mut prev_idx = None;

    for (target_idx, line) in self.bitmap.iter().zip(lines.iter()) {
      let line_bytes = line.as_ref().as_bytes();
      let num_newlines = match prev_idx {
        None => target_idx as usize,
        Some(prev) => (target_idx - prev) as usize,
      };

      if num_newlines > 0 {
        let old_len = out.len();
        out.resize(old_len + num_newlines, b'\n');
      }
      out.extend_from_slice(line_bytes);
      prev_idx = Some(target_idx);
    }

    unsafe { Some(HipStr::from(String::from_utf8_unchecked(out))) }
  }
}

impl<T: AsRef<[u8]>> From<T> for Restore {
  #[inline]
  fn from(bytes: T) -> Self {
    let bitmap = RoaringBitmap::deserialize_from(bytes.as_ref()).unwrap_or_default();
    Restore { bitmap }
  }
}

impl From<Restore> for Vec<u8> {
  #[inline]
  fn from(restore: Restore) -> Self {
    let size = restore.bitmap.serialized_size();
    let mut bytes = Vec::with_capacity(size);
    let _ = restore.bitmap.serialize_into(&mut bytes);
    bytes
  }
}
