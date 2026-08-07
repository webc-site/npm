mod auth;
mod dkim;
mod error;
pub mod extractor;
mod send;
mod user;

use std::net::SocketAddr;

use auth::auth;
use axum::{
  Router, middleware,
  routing::{get, post},
};
pub use error::{Error, Result};
use graceful_restart::CANCEL;
use tokio::net::TcpListener;

genv::s!(SMTP_API_PORT: u16 = 7501);

pub async fn run() -> aok::Result<()> {
  let addr = SocketAddr::from(([0, 0, 0, 0, 0, 0, 0, 0], *SMTP_API_PORT));

  let authed = Router::new()
    .route("/dkim/{domain}", get(dkim::get))
    .nest("/user", user::router())
    .layer(middleware::from_fn(auth));

  let app = Router::new()
    .route("/", get(|| async { "OK" }))
    .route("/send", post(send::send))
    .merge(authed);

  let listener = TcpListener::bind(addr).await?;
  log::info!("smtp_srv api listening on {addr}");

  axum::serve(listener, app)
    .with_graceful_shutdown(CANCEL.clone().cancelled_owned())
    .await?;

  Ok(())
}
