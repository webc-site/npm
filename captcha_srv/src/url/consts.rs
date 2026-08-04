use axum::http::header::{CONTENT_TYPE, HeaderName};

use crate::Result;

/// Captcha expiration time in seconds.
pub const EXPIRE_S: i64 = 300;

/// Default image width.
pub const CAPTCHA_W: u32 = 350;

/// Default image height.
pub const CAPTCHA_H: u32 = 350;

/// Default icon count.
pub const CAPTCHA_NUM: usize = 3;

/// Response header for JSON responses.
pub const JSON_H: [(HeaderName, &'static str); 1] = [(CONTENT_TYPE, "text/json")];

/// Successful verification response.
pub const OK: Result<([(HeaderName, &'static str); 1], &'static str)> = Ok((JSON_H, "1"));

/// Failed verification response.
pub const ERR: Result<([(HeaderName, &'static str); 1], &'static str)> = Ok((JSON_H, "0"));

