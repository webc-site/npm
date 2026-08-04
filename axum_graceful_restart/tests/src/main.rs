use std::{
  env,
  net::TcpListener as StdTcpListener,
  process::{exit, id as process_id},
  result::Result as StdResult,
  time::Duration,
};

use axum::{Router, routing::get};
use axum_graceful_restart::Result;
use tokio::time::sleep;

fn get_free_port() -> u16 {
  StdTcpListener::bind("127.0.0.1:0")
    .and_then(|listener| listener.local_addr())
    .map(|addr| addr.port())
    .unwrap_or(8899)
}

async fn fetch_pid(url: &str) -> StdResult<u32, String> {
  let resp = reqwest::get(url).await.map_err(|e| e.to_string())?;
  if !resp.status().is_success() {
    return Err(format!("non-success status: {}", resp.status()));
  }
  let txt = resp.text().await.map_err(|e| e.to_string())?;
  if !txt.starts_with("PID: ") {
    return Err(format!("unexpected response body: {txt}"));
  }
  let pid_str = &txt["PID: ".len()..];
  let pid = pid_str.parse::<u32>().map_err(|e| e.to_string())?;
  Ok(pid)
}

#[tokio::main]
async fn main() -> Result<()> {
  loginit::init();
  let app = Router::new().route("/", get(handler));

  let is_child = env::var("AXUM_RESTART_TCP_FD").is_ok();
  if is_child && env::var("AXUM_FORCE_PANIC").is_ok() {
    println!("Simulating startup failure for child/grandchild process!");
    exit(1);
  }
  if is_child {
    unsafe {
      env::set_var("AXUM_FORCE_PANIC", "1");
    }
  }

  let port = if !is_child {
    let p = get_free_port();
    unsafe {
      env::set_var("AXUM_TEST_PORT", p.to_string());
    }
    p
  } else {
    env::var("AXUM_TEST_PORT")
      .ok()
      .and_then(|s| s.parse().ok())
      .unwrap_or(8899)
  };

  let runner = if !is_child {
    // 父进程测试逻辑
    Some(tokio::spawn(async move {
      // 1. 等待服务在随机端口启动
      sleep(Duration::from_millis(500)).await;

      let url = format!("http://127.0.0.1:{port}/");

      // 2. 发起第一个慢速连接（将在 1.5s 后回复）
      let req1 = tokio::spawn({
        let url = url.clone();
        async move { fetch_pid(&url).await }
      });

      // 3. 在请求发起后，等待 200 毫秒，然后发送 SIGHUP 触发优雅重启
      sleep(Duration::from_millis(200)).await;
      let parent_pid = process_id();
      println!("Parent process {parent_pid} sending SIGHUP to itself...");
      #[cfg(unix)]
      {
        unsafe {
          libc::kill(parent_pid as libc::pid_t, libc::SIGHUP);
        }
      }

      // 4. 等待 1 秒，新进程应该已经启动并接管端口。我们发起第二个连接。
      sleep(Duration::from_millis(1000)).await;
      let req2 = tokio::spawn({
        let url = url.clone();
        async move { fetch_pid(&url).await }
      });

      // 5. 等待这两个请求完成，并断言其结果
      let pid1 = req1
        .await
        .unwrap()
        .expect("Request 1 to old process failed");
      let pid2 = req2
        .await
        .unwrap()
        .expect("Request 2 to new process failed");

      println!("Request 1 handled by PID: {pid1}");
      println!("Request 2 handled by PID: {pid2}");

      // 断言：两个请求的 PID 必须不同，说明连接被无缝递交给了新旧两个进程，且请求均无丢失
      assert_ne!(
        pid1, pid2,
        "PIDs must be different (graceful restart failed)"
      );
      assert_eq!(
        pid1, parent_pid,
        "Request 1 must be handled by parent process"
      );

      println!("Both requests finished successfully! Zero-downtime verified!");

      // ===== 新增测试：模拟孙子进程崩溃，子进程 pid2 应能复位并继续正常服务 =====
      println!("Parent sending SIGHUP to child process {pid2} (expecting grandchild to panic)...");
      #[cfg(unix)]
      {
        unsafe {
          libc::kill(pid2 as libc::pid_t, libc::SIGHUP);
        }
      }

      // 给孙子进程启动并崩溃留出时间，并等待子进程检测到失败重置状态
      sleep(Duration::from_millis(1000)).await;

      // 发起第三个请求，它应该依然成功地由 pid2 响应！
      let pid3 = fetch_pid(&url)
        .await
        .expect("Request 3 to active child process failed");
      println!("Request 3 handled by PID: {pid3}");
      assert_eq!(
        pid3, pid2,
        "Request 3 must be handled by child process pid2"
      );
      println!("Robustness verified! Active process handles grandchild panic correctly!");

      // 6. 发送 SIGINT 给新启动的子进程，使其也优雅停机，确保测试干净退出
      #[cfg(unix)]
      {
        println!("Parent sending SIGINT to child process {pid2}...");
        unsafe {
          libc::kill(pid2 as libc::pid_t, libc::SIGINT);
        }
      }

      // 给子进程一小点时间响应 SIGINT
      sleep(Duration::from_millis(200)).await;
    }))
  } else {
    // 子进程安全网：万一父进程崩溃未发信号，10秒后自毁防止僵尸进程
    tokio::spawn(async {
      sleep(Duration::from_secs(10)).await;
      println!("Child process safety timeout reached, exiting");
      exit(0);
    });
    None
  };

  let addr_str = format!("127.0.0.1:{port}");

  // 15 秒全局测试超时，防止整体卡死
  tokio::select! {
    res = axum_graceful_restart::GracefulRestart::new(addr_str.parse()?)?.serve(app) => {

      res?;
      if let Some(r) = runner
        && let Err(e) = r.await {
          eprintln!("Runner failed: {e:?}");
          exit(1);
        }
    }
    _ = sleep(Duration::from_secs(15)) => {
      eprintln!("Global test timeout reached! Test failed.");
      exit(1);
    }
  }

  Ok(())
}

async fn handler() -> String {
  let pid = process_id();
  sleep(Duration::from_millis(1500)).await;
  format!("PID: {pid}")
}
