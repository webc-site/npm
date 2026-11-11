#![cfg_attr(docsrs, feature(doc_cfg))]

use std::{
  env,
  path::{Path, PathBuf, absolute},
};

mod error;
pub use error::{Error, Result};

/// 从当前进程目录开始向上查找 `name`，直至根目录。
///
/// 找到返回 `Some(路径)`，未找到返回 `None`。
///
/// # 示例
///
/// ```no_run
/// # fn main() -> find_conf::Result<()> {
/// if let Some(path) = find_conf::find_conf("conf.toml")? {
///   println!("found: {}", path.display());
/// }
/// # Ok(())
/// # }
/// ```
pub fn find_conf(name: impl AsRef<Path>) -> Result<Option<PathBuf>> {
  find_conf_in_dir(env::current_dir()?, name)
}

/// 从 `dir` 开始逐级向上查找 `name`，直至根目录。
///
/// `dir` 为相对路径时先转换为绝对路径。
/// `name` 为绝对路径时只检查该路径本身。
/// 符号链接按 `Path::try_exists` 语义跟随，权限等 IO 错误通过 `Err` 返回。
pub fn find_conf_in_dir(dir: impl AsRef<Path>, name: impl AsRef<Path>) -> Result<Option<PathBuf>> {
  let name = name.as_ref();

  if name.is_absolute() {
    return Ok(if name.try_exists()? {
      Some(name.to_path_buf())
    } else {
      None
    });
  }

  // 复用同一 PathBuf，避免逐层 join 分配
  let mut cur = absolute(dir.as_ref())?;

  loop {
    cur.push(name);
    if cur.try_exists()? {
      return Ok(Some(cur));
    }
    cur.pop();

    // pop 失败表示已到根目录
    if !cur.pop() {
      return Ok(None);
    }
  }
}
