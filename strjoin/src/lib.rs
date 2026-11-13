#![cfg_attr(docsrs, feature(doc_cfg))]

use std::iter::Iterator;

pub trait Join {
  fn join(self, sep: impl AsRef<str>) -> String;
}

impl<I, S> Join for I
where
  I: Iterator<Item = S>,
  S: AsRef<str>,
{
  #[inline]
  fn join(mut self, sep: impl AsRef<str>) -> String {
    let sep = sep.as_ref();
    let Some(first) = self.next() else {
      return String::new();
    };
    let first = first.as_ref();
    let (lower, _) = self.size_hint();

    // 采用限额同质性预估策略：假设后续元素长度与首元素相近，但限制单项预估上限为 32 字节，防范内存暴涨
    let item_len_estimate = first.len().min(32);
    let mut res = String::with_capacity(
      first
        .len()
        .saturating_add(lower.saturating_mul(sep.len().saturating_add(item_len_estimate))),
    );
    res.push_str(first);

    self.for_each(|s| {
      res.push_str(sep);
      res.push_str(s.as_ref());
    });

    res
  }
}
