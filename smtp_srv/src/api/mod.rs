mod auth;
mod dkim;
mod error;
mod user;

use std::net::SocketAddr;

use auth::auth;
use axum::{
  Router, middleware,
  routing::{get, post},
};
pub use error::{Error, Result};
use graceful_restart::CANCEL;

genv::s!(SMTP_API_PORT: u16);

pub async fn run() -> aok::Result<()> {
  let addr = SocketAddr::from(([0, 0, 0, 0], *SMTP_API_PORT));

  let app = Router::new()
    .route("/", get(|| async { "OK" }))
    .route("/dkim/{domain}", get(dkim::get))
    .route("/user/{email}", post(user::set_by_path).delete(user::rm))
    .route("/user", post(user::set_by_body))
    .layer(middleware::from_fn(auth));

  let listener = tokio::net::TcpListener::bind(addr).await?;
  log::info!("smtp_srv api listening on {addr}");

  axum::serve(listener, app)
    .with_graceful_shutdown(CANCEL.clone().cancelled_owned())
    .await?;

  Ok(())
}
