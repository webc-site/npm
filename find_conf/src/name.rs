//! 候选名字集合。

use std::{
  collections::{BTreeSet, HashSet},
  ffi::{OsStr, OsString},
  hash::BuildHasher,
  path::{Path, PathBuf},
};

/// 候选名字集合。
///
/// 已为常见类型实现：`Path`、`PathBuf`、`str`、`String`、`OsStr`、`OsString`、
/// 切片、数组、`Vec`、`HashSet`、`BTreeSet`，以及它们的引用。
///
/// 单名字走 `single` 快速路径，按路径拼接探测，支持多级与绝对路径；
/// 集合按目录条目名匹配，名字不带路径分隔符。
pub trait Name {
  /// `name` 是否为候选之一。
  fn contains(&self, name: &Path) -> bool;

  /// 仅一个候选名字时返回它，用于逐层 stat 的快速路径。
  #[inline]
  fn single(&self) -> Option<&Path> {
    None
  }

  /// 候选为空。
  #[inline]
  fn is_empty(&self) -> bool {
    false
  }
}

// 单个名字
macro_rules! one {
  ($($t:ty),+ $(,)?) => {$(
    impl Name for $t {
      #[inline]
      fn contains(&self, name: &Path) -> bool {
        name == AsRef::<Path>::as_ref(self)
      }

      #[inline]
      fn single(&self) -> Option<&Path> {
        Some(AsRef::<Path>::as_ref(self))
      }
    }
  )+};
}

one!(Path, PathBuf, str, String, OsStr, OsString);

#[inline]
fn as_path<P: AsRef<Path> + ?Sized>(p: &P) -> &Path {
  p.as_ref()
}

/// 集合内是否有 `name`
#[inline]
fn any_of<'a, P: AsRef<Path> + ?Sized + 'a>(
  mut it: impl Iterator<Item = &'a P>,
  name: &Path,
) -> bool {
  it.any(|p| as_path(p) == name)
}

impl<T: Name + ?Sized> Name for &T {
  #[inline]
  fn contains(&self, name: &Path) -> bool {
    (**self).contains(name)
  }

  #[inline]
  fn single(&self) -> Option<&Path> {
    (**self).single()
  }

  #[inline]
  fn is_empty(&self) -> bool {
    (**self).is_empty()
  }
}

// 集合：线性比对；候选数通常很少
impl<P: AsRef<Path>> Name for [P] {
  fn contains(&self, name: &Path) -> bool {
    any_of(self.iter(), name)
  }

  fn is_empty(&self) -> bool {
    <[P]>::is_empty(self)
  }
}

impl<P: AsRef<Path>, const N: usize> Name for [P; N] {
  fn contains(&self, name: &Path) -> bool {
    any_of(self.iter(), name)
  }

  fn is_empty(&self) -> bool {
    N == 0
  }
}

impl<P: AsRef<Path>> Name for Vec<P> {
  fn contains(&self, name: &Path) -> bool {
    any_of(self.iter(), name)
  }

  fn is_empty(&self) -> bool {
    Vec::is_empty(self)
  }
}

impl<P: AsRef<Path>, S: BuildHasher> Name for HashSet<P, S> {
  fn contains(&self, name: &Path) -> bool {
    any_of(HashSet::iter(self), name)
  }

  fn is_empty(&self) -> bool {
    HashSet::is_empty(self)
  }
}

impl<P: AsRef<Path>> Name for BTreeSet<P> {
  fn contains(&self, name: &Path) -> bool {
    any_of(BTreeSet::iter(self), name)
  }

  fn is_empty(&self) -> bool {
    BTreeSet::is_empty(self)
  }
}
