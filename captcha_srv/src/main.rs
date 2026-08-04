use mimalloc::MiMalloc;

#[global_allocator]
static GLOBAL: MiMalloc = MiMalloc;

#[tokio::main]
async fn main() -> captcha_srv::Result<()> {
  let _ = captcha_srv::run().await?;
  Ok(())
}
