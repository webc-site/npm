use aok::{OK, Void};
use reqer::get;

#[tokio::main]
async fn main() -> Void {
  let resp = get("https://httpbin.org/get").send().await?;
  println!("status: {}", resp.status());
  let txt = resp.text().await?;
  println!("body:\n{txt}");
  OK
}
