pub struct CIter<'a, T> {
  idx: usize,
  pub li: &'a [T],
  ed: usize,
}

impl<'a, T> CIter<'a, T> {
  // 获取当前迭代器指向的元素的前一个位置
  // Get the previous position of the element pointed to by the current iterator
  pub fn pos(&self) -> usize {
    if self.idx == 0 { 0 } else { self.idx - 1 }
  }

  // 创建一个新的循环迭代器
  // Create a new circular iterator
  pub fn new(li: &'a [T], pos: usize) -> Self {
    let len = li.len();
    let idx = if len == 0 { 0 } else { pos % len };
    CIter { li, idx, ed: 0 }
  }

  // 从随机位置创建一个新的循环迭代器
  // Create a new circular iterator starting from a random position
  #[cfg(feature = "rand")]
  pub fn rand(li: &'a [T]) -> Self {
    use fastrand::usize as rand_usize;
    let len = li.len();
    let n = if len == 0 { 0 } else { rand_usize(..len) };
    Self::new(li, n)
  }
}

impl<'a, T> Iterator for CIter<'a, T> {
  type Item = (usize, &'a T);

  fn next(&mut self) -> Option<Self::Item> {
    let len = self.li.len();
    if self.ed < len {
      let idx = self.idx;
      let r = Some((idx, &self.li[idx]));
      self.ed += 1;
      self.idx += 1;
      if self.idx >= len {
        self.idx = 0;
      }
      r
    } else {
      None
    }
  }
}
