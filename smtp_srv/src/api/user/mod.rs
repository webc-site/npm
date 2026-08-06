mod ls;
mod rm;
mod set;

pub use ls::{get_by_host, get_by_page};
pub use rm::rm;

use set::set;
use sonic_rs::Deserialize;

use crate::api::{
  Error, Result,
  extractor::{Email, Json},
};

#[derive(Deserialize)]
pub struct UserReq {
  pub email: Option<String>,
  pub password: String,
}

pub async fn set_by_path(email: Email, Json(req): Json<UserReq>) -> Result<()> {
  set(&email.prefix, &email.host, &req.password).await
}

pub async fn set_by_body(Json(req): Json<UserReq>) -> Result<()> {
  let Some(email_str) = &req.email else {
    return Err(Error::BadRequest);
  };
  let email_str = email_str.trim().to_lowercase();
  let Some((prefix, host)) = email_str.split_once('@') else {
    return Err(Error::BadRequest);
  };
  if prefix.is_empty() || host.is_empty() {
    return Err(Error::BadRequest);
  }
  set(prefix, host, &req.password).await
}
