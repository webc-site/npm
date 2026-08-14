#![cfg_attr(docsrs, feature(doc_cfg))]

mod error;
mod s3;
pub use error::{Error, Result};
pub use s3::{Conf, S3, sign};
