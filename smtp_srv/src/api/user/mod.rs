mod json;
mod ls;
mod rm;
mod set;

use axum::extract::Path;
pub use json::Json;
pub use ls::{get_by_domain, get_by_page};
pub use rm::rm;

use set::set;
use sonic_rs::Deserialize;

use crate::api::{Error, Result};

#[derive(Deserialize)]
pub struct UserReq {
  pub email: Option<String>,
  pub password: String,
}

pub async fn set_by_path(Path(email): Path<String>, Json(req): Json<UserReq>) -> Result<()> {
  set(&email, &req.password).await
}

pub async fn set_by_body(Json(req): Json<UserReq>) -> Result<()> {
  let Some(email) = &req.email else {
    return Err(Error::BadRequest);
  };
  set(email, &req.password).await
}
