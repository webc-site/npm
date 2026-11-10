use crate::{Error, Result};

pub async fn handle_sighup() -> Result<()> {
  Err(Error::UnsupportedPlatform)
}
