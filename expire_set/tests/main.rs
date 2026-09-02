use std::{sync::Arc, time::Duration};

use aok::{OK, Void};
use expire_set::ExpireSet;
use log::info;
use tokio::{runtime::Runtime, time::sleep};

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[tokio::test]
async fn test_basic_insert_and_contains() -> Void {
  info!(">test_basic_insert_and_contains");
  let set = ExpireSet::<String>::new(10);

  // 测试插入和查询
  set.insert("key1".to_string());
  assert!(set.contains(&"key1".to_string()));

  set.insert("key2".to_string());
  assert!(set.contains(&"key1".to_string()));
  assert!(set.contains(&"key2".to_string()));

  // 测试不存在的键
  assert!(!set.contains(&"key3".to_string()));

  info!("basic insert and contains works");
  OK
}

#[tokio::test]
async fn test_expiration() -> Void {
  info!(">test_expiration");
  // 创建一个1秒过期的集合
  let set = ExpireSet::<String>::new(1);

  // 插入一些键
  set.insert("expire1".to_string());
  set.insert("expire2".to_string());

  assert!(set.contains(&"expire1".to_string()));
  assert!(set.contains(&"expire2".to_string()));

  info!("waiting 2.5 seconds for rotation and clear...");
  sleep(Duration::from_millis(2500)).await;

  // 轮转清空后，键已过期不存在
  assert!(!set.contains(&"expire1".to_string()));
  assert!(!set.contains(&"expire2".to_string()));

  info!("expiration works correctly");
  OK
}

#[tokio::test]
async fn test_cache_rotation() -> Void {
  info!(">test_cache_rotation");
  // 创建一个1秒过期的集合
  let set = ExpireSet::<i32>::new(1);

  // 第一批数据
  for i in 0..10 {
    set.insert(i);
  }

  assert!(set.contains(&5));

  info!("waiting 2 seconds for expiration...");
  sleep(Duration::from_secs(2)).await;

  // 插入第二批数据
  for i in 10..20 {
    set.insert(i);
  }

  // 第一批已经被清理
  assert!(!set.contains(&5));
  // 第二批应该存在
  assert!(set.contains(&15));

  info!("cache rotation works correctly");
  OK
}

#[tokio::test]
async fn test_concurrent_access() -> Void {
  info!(">test_concurrent_access");
  let set = Arc::new(ExpireSet::<String>::new(5));

  let mut handles = vec![];

  // 启动多个任务并发插入
  for i in 0..10 {
    let set_clone = set.clone();
    let handle = tokio::spawn(async move {
      for j in 0..100 {
        let key = format!("key_{}_{}", i, j);
        set_clone.insert(key.clone());
        assert!(set_clone.contains(&key));
      }
    });
    handles.push(handle);
  }

  // 等待所有任务完成
  for handle in handles {
    handle.await.unwrap();
  }

  // 验证一些键存在
  assert!(set.contains(&"key_0_0".to_string()));
  assert!(set.contains(&"key_5_50".to_string()));
  assert!(set.contains(&"key_9_99".to_string()));

  info!("concurrent access works correctly");
  OK
}

#[tokio::test]
async fn test_duplicate_inserts() -> Void {
  info!(">test_duplicate_inserts");
  let set = ExpireSet::<String>::new(10);

  // 重复插入同一个键
  set.insert("duplicate".to_string());
  set.insert("duplicate".to_string());
  set.insert("duplicate".to_string());

  // 应该只存在一次（DashSet 去重）
  assert!(set.contains(&"duplicate".to_string()));

  info!("duplicate inserts handled correctly");
  OK
}

#[test]
fn test_sync() -> Void {
  info!(">test_sync");
  // 测试 ExpireSet 是否可以在同步代码中使用
  let rt = Runtime::new().unwrap();
  rt.block_on(async {
    let set = ExpireSet::<i32>::new(10);
    set.insert(42);
    assert!(set.contains(&42));
  });

  info!("sync usage works");
  OK
}
