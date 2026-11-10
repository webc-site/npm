use std::{sync::Arc, time::Duration};

use aok::{OK, Void};
use graceful_restart::{CANCEL, LOCK};
use log::info;
#[cfg(unix)]
use nix::sys::signal::{Signal, kill};
#[cfg(unix)]
use nix::unistd::getpid;
#[cfg(unix)]
use tokio::signal::unix::{SignalKind, signal};
use tokio::{
  sync::{Barrier, RwLock, RwLockReadGuard},
  time::{sleep, timeout},
};
use tokio_util::sync::CancellationToken;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

fn test_lock_is_send_sync() -> Void {
  info!("> test_lock_is_send_sync");

  fn assert_send_sync<T: Send + Sync>() {}
  assert_send_sync::<RwLock<()>>();
  assert_send_sync::<RwLockReadGuard<'static, ()>>();

  OK
}

fn test_cancel_token_basic() -> Void {
  info!("> test_cancel_token_basic");
  assert!(!CANCEL.is_cancelled());
  info!("cancel token is not cancelled initially / 取消令牌初始状态未取消");
  OK
}

async fn test_lock_basic() -> Void {
  info!("> test_lock_basic");

  let _read_guard = LOCK.read().await;
  info!("acquired read lock / 获取读锁");
  drop(_read_guard);

  let _write_guard = LOCK.write().await;
  info!("acquired write lock / 获取写锁");
  drop(_write_guard);

  OK
}

async fn test_concurrent_lock_access() -> Void {
  info!("> test_concurrent_lock_access");

  let barrier = Arc::new(Barrier::new(3));
  let mut handles = vec![];

  for i in 0..3 {
    let barrier_clone = Arc::clone(&barrier);
    let handle = tokio::spawn(async move {
      barrier_clone.wait().await;
      {
        let guard = LOCK.read().await;
        info!("task {i} acquired read lock / 任务 {i} 获取读锁");
        drop(guard);
      }
      sleep(Duration::from_millis(10)).await;
      info!("task {i} released read lock / 任务 {i} 释放读锁");
    });
    handles.push(handle);
  }

  for handle in handles {
    handle.await.expect("task should complete / 任务应该完成");
  }

  OK
}

async fn test_read_lock_behavior() -> Void {
  info!("> test_read_lock_behavior");

  let handle = tokio::spawn(async {
    {
      let guard = LOCK.read().await;
      info!("background task acquired read lock / 后台任务获取读锁");
      drop(guard);
    }
    sleep(Duration::from_millis(20)).await;
    info!("background task released read lock / 后台任务释放读锁");
  });

  sleep(Duration::from_millis(5)).await;
  {
    let guard = LOCK.read().await;
    info!("main task acquired read lock / 主任务获取读锁");
    drop(guard);
  }
  sleep(Duration::from_millis(10)).await;
  info!("main task released read lock / 主任务释放读锁");

  handle
    .await
    .expect("background task should complete / 后台任务应该完成");
  OK
}

async fn test_multiple_readers() -> Void {
  info!("> test_multiple_readers");

  let barrier = Arc::new(Barrier::new(4));
  let mut handles = vec![];

  for i in 0..4 {
    let barrier_clone = Arc::clone(&barrier);
    let handle = tokio::spawn(async move {
      barrier_clone.wait().await;
      {
        let guard = LOCK.read().await;
        info!("reader {i} acquired read lock / 读者 {i} 获取读锁");
        drop(guard);
      }
      sleep(Duration::from_millis(15)).await;
      info!("reader {i} released read lock / 读者 {i} 释放读锁");
    });
    handles.push(handle);
  }

  for handle in handles {
    handle
      .await
      .expect("reader task should complete / 读者任务应该完成");
  }

  OK
}

async fn test_cancel_token_with_select() -> Void {
  info!("> test_cancel_token_with_select");

  let handle = tokio::spawn(async {
    tokio::select! {
      _ = CANCEL.cancelled() => {
        info!("received cancellation signal / 收到取消信号");
        "cancelled"
      }
      _ = sleep(Duration::from_millis(100)) => {
        info!("timeout reached / 达到超时");
        "timeout"
      }
    }
  });

  sleep(Duration::from_millis(10)).await;
  CANCEL.cancel();

  let result = handle.await.expect("task should complete / 任务应该完成");
  assert_eq!(result, "cancelled");

  OK
}

async fn test_request_handling_with_cancellation() -> Void {
  info!("> test_request_handling_with_cancellation");

  let local_cancel = CancellationToken::new();

  async fn simulate_request_handler(cancel: CancellationToken) -> &'static str {
    let _guard = LOCK.read().await;

    tokio::select! {
      _ = cancel.cancelled() => {
        info!("request cancelled during processing / 请求在处理过程中被取消");
        "cancelled"
      }
      _ = sleep(Duration::from_millis(50)) => {
        info!("request completed normally / 请求正常完成");
        "completed"
      }
    }
  }

  let handle1 = tokio::spawn(simulate_request_handler(local_cancel.clone()));
  let handle2 = tokio::spawn(simulate_request_handler(local_cancel.clone()));

  sleep(Duration::from_millis(20)).await;

  // 验证写锁当前被阻塞（因为请求正持有读锁）
  assert!(
    timeout(Duration::from_millis(5), LOCK.write())
      .await
      .is_err()
  );
  info!("write lock blocked as expected / 写锁如预期被阻塞");

  local_cancel.cancel();

  let result1 = handle1
    .await
    .expect("request 1 should complete / 请求1应该完成");
  let result2 = handle2
    .await
    .expect("request 2 should complete / 请求2应该完成");

  assert_eq!(result1, "cancelled");
  assert_eq!(result2, "cancelled");

  OK
}

async fn test_new_requests_after_cancellation() -> Void {
  info!("> test_new_requests_after_cancellation");

  let handle = tokio::spawn(async {
    tokio::select! {
      _ = CANCEL.cancelled() => {
        info!("new request immediately cancelled / 新请求立即被取消");
        "immediately_cancelled"
      }
      _ = sleep(Duration::from_millis(10)) => {
        info!("new request processed / 新请求被处理");
        "processed"
      }
    }
  });

  let result = handle.await.expect("task should complete / 任务应该完成");
  assert_eq!(result, "immediately_cancelled");

  OK
}

#[cfg(unix)]
async fn test_notify_ready_signal() -> Void {
  info!("> test_notify_ready_signal");
  let mut sigusr1 = signal(SignalKind::user_defined1())?;

  let pid = getpid();
  kill(pid, Signal::SIGUSR1)?;

  let result = timeout(Duration::from_millis(100), sigusr1.recv()).await;
  assert!(result.is_ok(), "Should receive SIGUSR1 signal");
  info!("successfully received simulated SIGUSR1 signal");
  OK
}

#[tokio::test]
async fn test_all_sequential() -> Void {
  test_lock_is_send_sync()?;
  test_cancel_token_basic()?;
  test_lock_basic().await?;
  test_concurrent_lock_access().await?;
  test_read_lock_behavior().await?;
  test_multiple_readers().await?;
  test_cancel_token_with_select().await?;
  test_request_handling_with_cancellation().await?;
  test_new_requests_after_cancellation().await?;
  #[cfg(unix)]
  test_notify_ready_signal().await?;
  OK
}
