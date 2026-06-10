#![cfg_attr(docsrs, feature(doc_cfg))]

mod agent;
mod chat;
mod error;
pub mod msg;
pub mod rt;
mod session;
mod stream;

pub use chat::run;
pub use error::{Error, Result};
pub use session::AgentSession;
