use std::{
  path::{Path, PathBuf},
  sync::Arc,
  thread,
};

use crossfire::{
  Rx,
  mpsc::{self, Array},
};
use ignore_dir::{DefaultIgnore, Ignore};
use walkdir::WalkDir;

use crate::{Error, Result};

/// 有界队列容量，遍历线程最多领先接收方 64 条路径。
pub const CHANNEL_SIZE: usize = 64;

/// 文件路径接收器。
pub type Receiver = Rx<Array<PathBuf>>;

/// 按扩展名查找文件，遍历在独立线程中进行，结果通过有界队列流式返回。
#[derive(Clone)]
pub struct FindExt {
  ext: Arc<[Box<str>]>,
  ignore: Arc<dyn Ignore>,
}

impl FindExt {
  /// 使用默认忽略策略。
  ///
  /// `ext_li` 中每项都是一个扩展名，不含 `.`，例如 `["toml", "yml", "yaml"]`。
  pub fn new(ext_li: impl IntoIterator<Item = impl AsRef<str>>) -> Self {
    Self::new_with_ignore(ext_li, DefaultIgnore)
  }

  /// 指定目录忽略策略。
  pub fn new_with_ignore(
    ext_li: impl IntoIterator<Item = impl AsRef<str>>,
    ignore: impl Ignore + 'static,
  ) -> Self {
    let ext: Arc<[Box<str>]> = ext_li.into_iter().map(|ext| ext.as_ref().into()).collect();
    Self {
      ext,
      ignore: Arc::new(ignore),
    }
  }

  /// 遍历 `dir`，把扩展名命中的文件路径发送到接收器。
  ///
  /// 返回接收器后遍历已在线程中开始。丢弃接收器会让遍历线程尽快退出。
  pub fn find(&self, dir: impl AsRef<Path>) -> Result<Receiver> {
    let dir = dir.as_ref().to_path_buf();
    let ext = self.ext.clone();
    let ignore = self.ignore.clone();
    let (tx, rx) = mpsc::bounded_blocking::<PathBuf>(CHANNEL_SIZE);

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

          if ext.iter().any(|ext| ext.as_bytes() == suffix) && tx.send(entry.into_path()).is_err() {
            // 接收器已丢弃
            break;
          }
        }
      })
      .map_err(Error::Spawn)?;

    Ok(rx)
  }
}
