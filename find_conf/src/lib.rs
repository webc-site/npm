#![cfg_attr(docsrs, feature(doc_cfg))]

use std::{
  env,
  fs::read_dir,
  io::ErrorKind,
  path::{Component, Path, PathBuf, absolute},
};

mod error;
pub use error::{Error, Result};

mod name;
pub use name::Name;

/// 从当前进程目录开始向上查找候选名字，直至根目录。
///
/// 命中返回 `Some(路径)`，未找到返回 `None`。
///
/// # 示例
///
/// ```no_run
/// # fn main() -> find_conf::Result<()> {
/// // 单个名字
/// if let Some(path) = find_conf::find_conf("conf.toml")? {
///   println!("found: {}", path.display());
/// }
///
/// // 一组名字：取最近一层命中的
/// let repo = find_conf::find_conf([".git", ".hg", ".svn"])?;
/// # Ok(())
/// # }
/// ```
pub fn find_conf(name: impl Name) -> Result<Option<PathBuf>> {
  find_conf_in_dir(env::current_dir()?, name)
}

/// 从 `dir` 开始逐级向上查找候选名字，直至根目录。
///
/// - 单名字（`Name::single` 有值）逐层拼接后 stat，支持多级与绝对路径
/// - 集合每层只读一次目录，按条目名匹配，最近一层命中即返回
/// - 同层多个候选同时命中时，返回哪个取决于目录条目顺序
/// - `dir` 不存在时直接向上继续
/// - 权限等 IO 错误返回 `Err`，不跳过
pub fn find_conf_in_dir(dir: impl AsRef<Path>, name: impl Name) -> Result<Option<PathBuf>> {
  if let Some(n) = name.single() {
    return find_one(dir.as_ref(), n);
  }

  if name.is_empty() {
    return Ok(None);
  }

  // 复用同一 PathBuf，避免逐层分配
  let mut cur = absolute(dir.as_ref())?;

  loop {
    match read_dir(&cur) {
      Ok(entries) => {
        for entry in entries {
          let file = entry?.file_name();
          if name.contains(Path::new(&file)) {
            cur.push(&file);
            // 命中后确认存在，排除断链等假阳性
            if cur.try_exists()? {
              return Ok(Some(cur));
            }
            cur.pop();
          }
        }
      }
      // 当前层不存在或不是目录，继续向上
      Err(err) if !matches!(err.kind(), ErrorKind::NotFound | ErrorKind::NotADirectory) => {
        return Err(err.into());
      }
      Err(_) => {}
    }

    // pop 失败表示已到根目录
    if !cur.pop() {
      return Ok(None);
    }
  }
}

/// 单名字快速路径：逐层拼接后 stat，不读目录。
fn find_one(dir: &Path, name: &Path) -> Result<Option<PathBuf>> {
  // 绝对路径只查一次
  if name.is_absolute() {
    return Ok(name.try_exists()?.then(|| name.to_path_buf()));
  }

  // 仅单级普通组件可用 push/pop 严格配对；其余用 join 探测
  let simple = {
    let mut it = name.components();
    matches!(it.next(), Some(Component::Normal(_))) && it.next().is_none()
  };

  let mut cur = absolute(dir)?;
  let mut hit = PathBuf::new();

  loop {
    if simple {
      cur.push(name);
      if cur.try_exists()? {
        return Ok(Some(cur));
      }
      cur.pop();
    } else {
      hit.clone_from(&cur);
      hit.push(name);
      if hit.try_exists()? {
        return Ok(Some(hit));
      }
    }

    // pop 失败表示已到根目录
    if !cur.pop() {
      return Ok(None);
    }
  }
}
