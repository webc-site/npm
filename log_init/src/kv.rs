use std::fmt::Write;

use log::kv;
use logforth::{
  Error as LogforthError,
  kv::{KeyView, ValueView, Visitor},
};

#[derive(Debug, Default)]
pub struct Kv {
  pub text: String,
}

impl Kv {
  pub const fn new() -> Self {
    Self {
      text: String::new(),
    }
  }

  pub fn with_capacity(capacity: usize) -> Self {
    Self {
      text: String::with_capacity(capacity),
    }
  }
}

impl<'kvs> kv::VisitSource<'kvs> for Kv {
  fn visit_pair(&mut self, key: kv::Key<'kvs>, value: kv::Value<'kvs>) -> Result<(), kv::Error> {
    KvRef(&mut self.text).visit_pair(key, value)
  }
}

impl Visitor for Kv {
  fn visit(&mut self, key: KeyView<'_>, value: ValueView<'_>) -> Result<(), LogforthError> {
    KvRef(&mut self.text).visit(key, value)
  }
}

pub(crate) struct KvRef<'a>(pub &'a mut String);

impl<'kvs> kv::VisitSource<'kvs> for KvRef<'_> {
  fn visit_pair(&mut self, key: kv::Key<'kvs>, value: kv::Value<'kvs>) -> Result<(), kv::Error> {
    let _ = write!(self.0, " {key}={value}");
    Ok(())
  }
}

impl Visitor for KvRef<'_> {
  fn visit(&mut self, key: KeyView<'_>, value: ValueView<'_>) -> Result<(), LogforthError> {
    let _ = write!(self.0, " {key}={value}");
    Ok(())
  }
}
