#![cfg_attr(docsrs, feature(doc_cfg))]

mod auth;
mod cbor;
mod client;
mod conf;
pub mod consts;
mod db;
mod error;
mod record_id;

pub use client::{Sur, open};
pub use conf::{Conf, surreal};
pub use consts::APPLICATION_CBOR;
pub use db::{Db, QueryItem};
pub use error::{Error, Result};
pub use record_id::RecordId;
