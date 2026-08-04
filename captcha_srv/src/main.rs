
use mimalloc::MiMalloc;

#[global_allocator]
static GLOBAL: MiMalloc = MiMalloc;

#[cfg(not(feature = "shuttle"))]
use captcha_srv::{Result, run};

#[cfg(not(feature = "shuttle"))]
#[tokio::main]
async fn main() -> Result<()> {
  let _ = run().await?;
  Ok(())
}

#[cfg(feature = "shuttle")]
#[shuttle_runtime::main]
async fn shuttle_main() -> shuttle_axum::ShuttleAxum {
  use std::io::Error as IoError;

  let router = captcha_srv::run()
    .await
    .map_err(|e| shuttle_runtime::CustomError::new(IoError::other(e)))?;

  Ok(router.into())
}
