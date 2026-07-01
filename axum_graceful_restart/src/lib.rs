#![cfg_attr(docsrs, feature(doc_cfg))]

pub(crate) mod error;
pub(crate) mod os;

pub use error::{Error, Result};
pub use os::{GracefulRestart, serve};
