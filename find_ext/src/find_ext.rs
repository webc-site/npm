use std::{
  path::{Path, PathBuf},
  sync::Arc,
  thread,
};

use crossfire::mpsc;
use ignore_dir::{DefaultIgnore, Ignore};
use walkdir::WalkDir;

use crate::{Error, Result, receiver::Receiver};

/// 有界队列容量，遍历线程最多领先接收方 64 条路径。
pub const CHANNEL_SIZE: usize = 64;

/// 扩展名集合，含构建期一次算好的长度掩码。
struct ExtSet {
  li: Box<[Box<str>]>,
  len: u64,
  /// 存在长度超出掩码范围的扩展名。
  long: bool,
}

impl ExtSet {
  fn new(ext_li: impl IntoIterator<Item = impl AsRef<str>>) -> Self {
    let mut li: Vec<Box<str>> = ext_li.into_iter().map(|ext| ext.as_ref().into()).collect();
    li.sort_unstable();
    li.dedup();

    let mut len = 0_u64;
    let mut long = false;
    for ext in &li {
      let size = ext.len();
      if size < u64::BITS as usize {
        len |= 1 << size;
      } else {
        long = true;
      }
    }

    Self {
      li: li.into(),
      len,
      long,
    }
  }

  #[inline]
  fn is_empty(&self) -> bool {
    self.li.is_empty()
  }

  #[inline]
  fn has(&self, suffix: &[u8]) -> bool {
    // 扩展名远短于 u32 上限，截断不会发生
    let len_ok = if suffix.len() >= u64::BITS as usize {
      self.long
    } else {
      self
        .len
        .checked_shr(suffix.len() as u32)
        .is_some_and(|bits| bits & 1 == 1)
    };
    len_ok && self.li.iter().any(|ext| ext.as_bytes() == suffix)
  }
}

/// 按扩展名查找文件，遍历在独立线程中进行，结果通过有界队列流式返回。
///
/// `I` 为编译期确定的忽略策略，避免目录判断的虚调用开销。
pub struct FindExt<I: Ignore = DefaultIgnore> {
  ext: Arc<ExtSet>,
  ignore: Arc<I>,
}

impl<I: Ignore> Clone for FindExt<I> {
  fn clone(&self) -> Self {
    Self {
      ext: self.ext.clone(),
      ignore: self.ignore.clone(),
    }
  }
}

impl FindExt {
  /// 使用默认忽略策略。
  ///
  /// `ext_li` 中每项都是一个扩展名，不含 `.`，例如 `["toml", "yml", "yaml"]`。
  pub fn new(ext_li: impl IntoIterator<Item = impl AsRef<str>>) -> Self {
    Self::new_with_ignore(ext_li, DefaultIgnore)
  }
}

impl<I: Ignore + 'static> FindExt<I> {
  /// 指定目录忽略策略。
  ///
  /// 重复扩展名会自动去重。
  pub fn new_with_ignore(ext_li: impl IntoIterator<Item = impl AsRef<str>>, ignore: I) -> Self {
    Self {
      ext: Arc::new(ExtSet::new(ext_li)),
      ignore: Arc::new(ignore),
    }
  }

  /// 遍历 `dir`，把扩展名命中的文件路径发送到接收器。
  ///
  /// 返回接收器后遍历已在线程中开始。丢弃接收器会让遍历线程尽快退出。
  pub fn find(&self, dir: impl AsRef<Path>) -> Result<Receiver> {
    let (tx, rx) = mpsc::bounded_blocking::<PathBuf>(CHANNEL_SIZE);
    if self.ext.is_empty() {
      return Ok(Receiver::new(rx));
    }

    let dir = dir.as_ref().to_path_buf();
    let ext = self.ext.clone();
    let ignore = self.ignore.clone();

    thread::Builder::new()
      .name("find_ext".into())
      .spawn(move || {
        let walk = WalkDir::new(dir)
          .follow_links(false)
          .into_iter()
          .filter_entry(|entry| {
            entry.depth() == 0 || !entry.file_type().is_dir() || !ignore.ignore(entry.file_name())
          });

        for entry in walk {
          let entry = match entry {
            Ok(entry) => entry,
            Err(err) => {
              log::debug!("walk error: {err}");
              continue;
            }
          };

          if !entry.file_type().is_file() {
            continue;
          }

          // 按需求取文件名中最后一个 `.` 之后的部分
          let name = entry.file_name().as_encoded_bytes();
          let Some(dot) = name.iter().rposition(|&byte| byte == b'.') else {
            continue;
          };
          let suffix = &name[dot + 1..];

          if ext.has(suffix) && tx.send(entry.into_path()).is_err() {
            // 接收器已丢弃
            break;
          }
        }
      })
      .map_err(Error::Spawn)?;

    Ok(Receiver::new(rx))
  }
}
