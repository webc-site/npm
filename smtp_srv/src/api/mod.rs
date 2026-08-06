mod auth;
mod dkim;
mod error;
pub mod extractor;
mod user;

use std::net::SocketAddr;

use auth::auth;
use axum::{
  Router, middleware,
  routing::{delete, get, post},
};
pub use error::{Error, Result};
use graceful_restart::CANCEL;

genv::s!(SMTP_API_PORT: u16);

pub async fn run() -> aok::Result<()> {
  let addr = SocketAddr::from(([0, 0, 0, 0], *SMTP_API_PORT));

  let app = Router::new()
    .route("/", get(|| async { "OK" }))
    .route("/dkim/{domain}", get(dkim::get))
    .route("/user/{email}", delete(user::rm))
    .route("/user", post(user::set))
    .route("/user/{host}", get(user::by_host))
    .route("/user/{host}/{page}", get(user::by_page))
    .layer(middleware::from_fn(auth));

  let listener = tokio::net::TcpListener::bind(addr).await?;
  log::info!("smtp_srv api listening on {addr}");

  axum::serve(listener, app)
    .with_graceful_shutdown(CANCEL.clone().cancelled_owned())
    .await?;

  Ok(())
}
