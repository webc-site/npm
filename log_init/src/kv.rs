use std::fmt::Write;

use log::kv;
use logforth::{
  Error as LogforthError,
  kv::{KeyView, ValueView, Visitor},
};

pub struct Kv {
  pub text: String,
}

impl<'kvs> kv::VisitSource<'kvs> for Kv {
  fn visit_pair(&mut self, key: kv::Key<'kvs>, value: kv::Value<'kvs>) -> Result<(), kv::Error> {
    let _ = write!(&mut self.text, " {key}={value}");
    Ok(())
  }
}

impl Visitor for Kv {
  fn visit(&mut self, key: KeyView<'_>, value: ValueView<'_>) -> Result<(), LogforthError> {
    let _ = write!(&mut self.text, " {key}={value}");
    Ok(())
  }
}
