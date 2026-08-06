mod auth;
mod dkim;

use auth::auth;
use axum::{middleware, routing::get, Router};
use graceful_restart::CANCEL;
use std::net::SocketAddr;

genv::s!(SMTP_API_PORT: u16);

pub async fn run() -> aok::Result<()> {
  let addr = SocketAddr::from(([0, 0, 0, 0], *SMTP_API_PORT));

  let app = Router::new()
    .route("/", get(|| async { "OK" }))
    .route("/dkim/{domain}", get(dkim::get))
    .layer(middleware::from_fn(auth));

  let listener = tokio::net::TcpListener::bind(addr).await?;
  log::info!("smtp_srv api listening on {addr}");

  axum::serve(listener, app)
    .with_graceful_shutdown(CANCEL.clone().cancelled_owned())
    .await?;

  Ok(())
}
