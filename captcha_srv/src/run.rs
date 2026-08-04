use axum::{Router, routing::get as axum_get};

use crate::{Result, get, init, post};

/// Runs the CAPTCHA HTTP service using Axum.
pub async fn run() -> Result<Router> {
  init().await?;

  let app = Router::new().route("/", axum_get(get).post(post));

  #[cfg(not(feature = "shuttle"))]
  {
    use std::net::SocketAddr;

    let port: u16 = genv::get_or_default("PORT", 8080);
    let addr: SocketAddr = format!("0.0.0.0:{port}").parse()?;

    log::info!("captcha_srv {addr}");
    axum_graceful_restart::serve(addr, app.clone()).await?;
  }

  Ok(app)
}
