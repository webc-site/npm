use aok::{OK, Result};
use log::info;
use tokio::time::{Duration, sleep};

// --- 数据库模块 (优先级 0，最先初始化) ---
pub struct Database {}

impl Database {
  pub fn query(&self) -> String {
    "cached_user_roles".to_string()
  }
}

pub async fn connect_db() -> Result<Database> {
  info!("DB: Connecting to database...");
  sleep(Duration::from_secs(2)).await;
  info!("DB: Connection established.");
  Ok(Database {})
}

// 注册数据库初始化，优先级为 0
xboot::init!(DB: Database {
  connect_db().await
}, 0);


// --- 用户服务模块 (优先级 1，依赖于数据库) ---
pub struct UserService {
  pub roles: String,
}

impl UserService {
  pub fn check_roles(&self) {
    info!("UserService: Verified roles: {}", self.roles);
  }
}

pub async fn init_user_service() -> Result<UserService> {
  info!("UserService: Initializing service...");
  // 核心依赖展示：此处直接读取并调用已初始化的全局变量 DB
  let roles = DB.query();
  info!("UserService: Loaded startup configuration from DB: {}", roles);
  Ok(UserService { roles })
}

// 注册服务初始化，优先级为 1 (确保在优先级 0 的 DB 初始化完成后再运行)
xboot::init!(USER_SERVICE: UserService {
  init_user_service().await
}, 1);


// --- 主程序入口 ---
#[tokio::main]
async fn main() -> Result<()> {
  log_init::init();
  
  info!("Main: Running xboot initialization...");
  xboot::init().await?;
  info!("Main: xboot initialization completed.");
  
  // 调用业务逻辑以验证服务已被成功初始化且成功获取了依赖数据
  USER_SERVICE.check_roles();
  
  OK
}
