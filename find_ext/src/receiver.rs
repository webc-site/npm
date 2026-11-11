use std::{iter::FusedIterator, path::PathBuf};

use crossfire::{Rx, mpsc::Array};

/// 文件路径接收器。
///
/// 通道关闭后所有接收方法返回 `None`。
#[derive(Debug)]
pub struct Receiver {
  rx: Rx<Array<PathBuf>>,
}

impl Receiver {
  pub(crate) fn new(rx: Rx<Array<PathBuf>>) -> Self {
    Self { rx }
  }

  /// 阻塞接收一条路径，通道关闭时返回 `None`。
  #[inline]
  pub fn recv(&self) -> Option<PathBuf> {
    self.rx.recv().ok()
  }

  /// 非阻塞接收一条路径，暂无数据或通道关闭时返回 `None`。
  #[inline]
  pub fn try_recv(&self) -> Option<PathBuf> {
    self.rx.try_recv().ok()
  }

  /// 借用接收器迭代。
  #[inline]
  pub fn iter(&self) -> Iter<'_> {
    Iter { rx: &self.rx }
  }
}

impl Iterator for Receiver {
  type Item = PathBuf;

  #[inline]
  fn next(&mut self) -> Option<PathBuf> {
    self.recv()
  }
}

impl FusedIterator for Receiver {}

impl<'a> IntoIterator for &'a Receiver {
  type Item = PathBuf;
  type IntoIter = Iter<'a>;

  #[inline]
  fn into_iter(self) -> Self::IntoIter {
    self.iter()
  }
}

/// 借用式接收迭代器。
#[derive(Debug)]
pub struct Iter<'a> {
  rx: &'a Rx<Array<PathBuf>>,
}

impl Iterator for Iter<'_> {
  type Item = PathBuf;

  #[inline]
  fn next(&mut self) -> Option<PathBuf> {
    self.rx.recv().ok()
  }
}

impl FusedIterator for Iter<'_> {}
