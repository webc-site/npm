#![cfg_attr(docsrs, feature(doc_cfg))]

mod error;
mod r;
mod run;
mod url;

pub use error::{Error, Result};
pub use r::{R_CAPTCHA, captcha_key};
pub use run::run;
pub use url::{CAPTCHA_H, CAPTCHA_NUM, CAPTCHA_W, EXPIRE_S, get, post};
