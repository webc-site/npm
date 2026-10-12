mod consts;
mod get;
mod post;
mod verify;

pub use consts::{CAPTCHA_H, CAPTCHA_NUM, CAPTCHA_W, EXPIRE_S};
pub use get::get;
pub use post::{ERR, JSON_H, OK, post};
pub use verify::verify;
