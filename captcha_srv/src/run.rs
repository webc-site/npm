use std::net::SocketAddr;

use axum::{Router, routing::get as axum_get};
use xkv::xboot;

use crate::{Result, get, post};

/// Runs the CAPTCHA HTTP service using Axum on the PORT specified by genv.
pub async fn run() -> Result<()> {
  xboot::init().await?;

  let port: u16 = genv::get_or_default("PORT", 8080);
  let addr: SocketAddr = format!("0.0.0.0:{port}").parse()?;

  let app = Router::new().route("/", axum_get(get).post(post));

  axum_graceful_restart::serve(addr, app).await?;

  Ok(())
}
