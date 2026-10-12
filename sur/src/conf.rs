use serde::{Deserialize, Serialize};

use crate::{Sur, client::open};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Conf {
  #[serde(alias = "url")]
  pub uri: String,
  #[serde(alias = "user")]
  pub username: String,
  #[serde(alias = "pass")]
  pub password: String,
  #[serde(default, alias = "ns", skip_serializing_if = "Option::is_none")]
  pub namespace: Option<String>,
}

impl AsRef<Conf> for Conf {
  #[inline]
  fn as_ref(&self) -> &Conf {
    self
  }
}

#[inline]
pub fn surreal(conf: impl AsRef<Conf>) -> Sur {
  let c = conf.as_ref();
  open(&c.uri, &c.username, &c.password, c.namespace.as_deref())
}
