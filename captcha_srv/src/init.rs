use xkv::xboot;

use crate::Result;

/// Initializes log and xboot configuration.
pub async fn init() -> Result<()> {
  loginit::init();
  xboot::init().await?;
  Ok(())
}
