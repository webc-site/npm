use crate::Result;

/// Captcha expiration time in seconds.
pub const EXPIRE_S: i64 = 300;

/// Default image width.
pub const CAPTCHA_W: u32 = 350;

/// Default image height.
pub const CAPTCHA_H: u32 = 350;

/// Default icon count.
pub const CAPTCHA_NUM: usize = 3;

/// Successful verification response.
pub const OK: Result<&'static str> = Ok("1");

/// Failed verification response.
pub const ERR: Result<&'static str> = Ok("0");
