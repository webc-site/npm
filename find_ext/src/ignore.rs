use std::ffi::OsStr;

/// 常见依赖与构建产物目录，遍历时默认跳过。
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
  ".venv",
  ".git",
  ".hg",
  ".svn",
  ".idea",
  ".vscode",
  ".next",
  ".nuxt",
  ".output",
  ".cache",
  ".turbo",
  ".parcel-cache",
  ".svelte-kit",
  ".docusaurus",
  ".gradle",
  ".terraform",
];

/// 目录忽略策略。
///
/// `name` 是被访问目录的文件名（不含路径）。返回 `true` 时跳过该目录及其所有子项。
/// 根目录永远不忽略。
pub trait Ignore: Send + Sync {
  fn ignore(&self, name: &OsStr) -> bool;
}

/// 默认策略：忽略以 `.` 开头的目录，以及 [`IGNORE_DIR`] 中的常见目录。
#[derive(Debug, Clone, Copy, Default)]
pub struct DefaultIgnore;

impl Ignore for DefaultIgnore {
  fn ignore(&self, name: &OsStr) -> bool {
    let bytes = name.as_encoded_bytes();
    bytes.first() == Some(&b'.')
      || IGNORE_DIR
        .iter()
        .any(|dir| dir.as_bytes().eq_ignore_ascii_case(bytes))
  }
}

impl<F> Ignore for F
where
  F: Fn(&OsStr) -> bool + Send + Sync,
{
  fn ignore(&self, name: &OsStr) -> bool {
    self(name)
  }
}
