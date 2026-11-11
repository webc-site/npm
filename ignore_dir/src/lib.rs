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

/// `IGNORE_DIR` 中出现过的名字长度，编译期生成。
const IGNORE_LEN: u64 = len_mask(IGNORE_DIR);
/// `IGNORE_DIR` 中出现过的首字节，编译期生成。
const IGNORE_HEAD: u64 = head_mask(IGNORE_DIR);

const fn len_mask(list: &[&str]) -> u64 {
  let mut mask = 0_u64;
  let mut i = 0;
  while i < list.len() {
    mask |= 1 << list[i].len();
    i += 1;
  }
  mask
}

const fn lower(byte: u8) -> u8 {
  if byte >= b'A' && byte <= b'Z' {
    byte + 32
  } else {
    byte
  }
}

/// 首字节映射到 0..=36，非字母数字统一到 36。
const fn head_bit(byte: u8) -> u32 {
  let byte = lower(byte);
  if byte >= b'a' && byte <= b'z' {
    (byte - b'a') as u32
  } else if byte >= b'0' && byte <= b'9' {
    26 + (byte - b'0') as u32
  } else {
    36
  }
}

const fn head_mask(list: &[&str]) -> u64 {
  let mut mask = 0_u64;
  let mut i = 0;
  while i < list.len() {
    mask |= 1 << head_bit(list[i].as_bytes()[0]);
    i += 1;
  }
  mask
}

#[inline]
fn maybe_common(bytes: &[u8]) -> bool {
  let Some(&head) = bytes.first() else {
    return false;
  };
  // 目录名远小于 u32 上限，截断不会发生
  IGNORE_LEN
    .checked_shr(bytes.len() as u32)
    .is_some_and(|bits| bits & 1 == 1)
    && (IGNORE_HEAD >> head_bit(head)) & 1 == 1
}

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
      || (maybe_common(bytes)
        && IGNORE_DIR
          .iter()
          .any(|dir| dir.as_bytes().eq_ignore_ascii_case(bytes)))
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
