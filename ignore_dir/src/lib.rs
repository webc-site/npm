#![cfg_attr(docsrs, feature(doc_cfg))]

//! 目录遍历忽略策略。
//!
//! 默认忽略两类目录：
//!
//! 1. 以 `.` 开头的目录
//! 2. [`IGNORE_DIR`] 中的常见依赖与构建产物目录
//!
//! ```
//! use std::ffi::OsStr;
//! use ignore_dir::{DefaultIgnore, Ignore};
//!
//! assert!(DefaultIgnore.ignore(OsStr::new(".git")));
//! assert!(DefaultIgnore.ignore(OsStr::new("node_modules")));
//! assert!(!DefaultIgnore.ignore(OsStr::new("src")));
//! ```

use std::ffi::OsStr;

/// 常见依赖与构建产物目录。
///
/// 以 `.` 开头的目录由 [`is_hidden`] 统一处理，此列表不重复收录。
pub const IGNORE_DIR: &[&str] = &[
  "node_modules",
  "target",
  "dist",
  "build",
  "out",
  "vendor",
  "bower_components",
  "coverage",
  "Pods",
  "__pycache__",
  "venv",
];

/// 目录名是否以 `.` 开头。
#[inline]
pub fn is_hidden(name: &OsStr) -> bool {
  hidden(name.as_encoded_bytes())
}

#[inline]
fn hidden(bytes: &[u8]) -> bool {
  bytes.first() == Some(&b'.')
}

/// 目录忽略策略。
///
/// `name` 是被访问目录的文件名（不含路径）。返回 `true` 时跳过该目录及其所有子项。
pub trait Ignore: Send + Sync {
  fn ignore(&self, name: &OsStr) -> bool;
}

/// 默认策略：忽略隐藏目录与 [`IGNORE_DIR`] 中的目录。
#[derive(Debug, Clone, Copy, Default)]
pub struct DefaultIgnore;

impl Ignore for DefaultIgnore {
  #[inline]
  fn ignore(&self, name: &OsStr) -> bool {
    let bytes = name.as_encoded_bytes();
    hidden(bytes)
      || IGNORE_DIR
        .iter()
        .any(|dir| dir.as_bytes().eq_ignore_ascii_case(bytes))
  }
}

impl<F> Ignore for F
where
  F: Fn(&OsStr) -> bool + Send + Sync,
{
  #[inline]
  fn ignore(&self, name: &OsStr) -> bool {
    self(name)
  }
}
