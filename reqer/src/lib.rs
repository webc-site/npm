#![cfg_attr(docsrs, feature(doc_cfg))]

mod client;
mod error;
mod request;
mod response;

pub use client::{Client, delete, get, head, patch, post, put};
pub use error::{Error, Result};
pub use request::{Method, RequestBuilder};
pub use response::Response;
