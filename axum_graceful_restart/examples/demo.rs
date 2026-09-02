use std::{process::id as process_id, time::Duration};

use axum::{Router, routing::get};
use axum_graceful_restart::{Result, serve};
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<()> {
  loginit::init();
  let app = Router::new().route("/", get(handler));
  serve("[::]:8899".parse()?, app).await
}

async fn handler() -> String {
  let pid = process_id();
  println!("new conn");
  sleep(Duration::from_secs(10)).await;
  format!("PID: {pid}")
}
