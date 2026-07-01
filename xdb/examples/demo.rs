use aok::{OK, Void};
use xdb::DB;

#[tokio::main]
async fn main() -> Void {
  // 必须在 main 开始时调用 xboot::init().await? 以触发静态变量 DB 的初始化
  xboot::init().await?;

  // 验证 DB 是否就绪，尝试获取连接
  let _conn = DB.get_conn().await?;
  println!("Database connection pool initialized successfully.");

  OK
}
