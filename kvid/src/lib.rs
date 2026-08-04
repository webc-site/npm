mod error;
mod r#impl;

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

pub use error::{Error, Result};
use hipstr::HipStr;
use parking_lot::{Mutex, RawMutex, lock_api::RawMutex as _};
use ts_::sec as ts_sec;

// 预加载时长（秒）/ preload duration in seconds
pub const PRELOAD_SEC: u64 = 60;
pub const STEP_MIN: u64 = 1;
pub const STEP_MAX: u64 = 1000000;
// Redis hash key / Redis 哈希键
pub const KVID_KEY: &str = "kvid";

#[derive(Debug, Clone, Copy)]
struct Seg {
  id: u64,
  max: u64,
}

#[derive(Debug)]
struct Slow {
  next: Option<Seg>,
  step: u64,
  ts: u64,
}

impl Slow {
  const fn new() -> Self {
    Self {
      next: None,
      step: STEP_MIN,
      // 0 表示从未获取过 / 0 means never fetched
      ts: 0,
    }
  }
}

#[repr(align(64))]
#[derive(Debug)]
struct CachePadded<T> {
  value: T,
}

impl<T> CachePadded<T> {
  const fn new(value: T) -> Self {
    Self { value }
  }
}

impl<T> std::ops::Deref for CachePadded<T> {
  type Target = T;
  #[inline]
  fn deref(&self) -> &Self::Target {
    &self.value
  }
}

#[derive(Debug)]
struct Fast {
  id: CachePadded<AtomicU64>,
  max: CachePadded<AtomicU64>,
  lock: CachePadded<AtomicBool>,
}

impl Fast {
  const fn new() -> Self {
    Self {
      id: CachePadded::new(AtomicU64::new(0)),
      max: CachePadded::new(AtomicU64::new(0)),
      lock: CachePadded::new(AtomicBool::new(false)),
    }
  }
}

struct LockGuard<'a>(&'a AtomicBool);

impl Drop for LockGuard<'_> {
  #[inline]
  fn drop(&mut self) {
    self.0.store(false, Ordering::Release);
  }
}

pub struct KvId {
  pub name: HipStr<'static>,
  fast: Fast,
  slow: Mutex<Slow>,
  fetch_lock: tokio::sync::Mutex<()>,
}

impl KvId {
  pub const fn const_new(name: &'static str) -> Self {
    Self {
      name: HipStr::borrowed(name),
      fast: Fast::new(),
      // RawMutex::INIT 是初始状态值，非共享实例
      // RawMutex::INIT is init state value, not shared instance
      slow: Mutex::const_new(RawMutex::INIT, Slow::new()),
      fetch_lock: tokio::sync::Mutex::const_new(()),
    }
  }

  pub fn new(name: impl Into<HipStr<'static>>) -> Self {
    Self {
      name: name.into(),
      fast: Fast::new(),
      slow: Mutex::new(Slow::new()),
      fetch_lock: tokio::sync::Mutex::new(()),
    }
  }

  // 后台填充 / background fill
  fn spawn_fill(&'static self) {
    if self.fast.lock.swap(true, Ordering::Acquire) {
      return;
    }
    tokio::spawn(async move {
      self.fill().await;
    });
  }

  async fn fill(&self) {
    let _fetch_guard = self.fetch_lock.lock().await;
    let _guard = LockGuard(&self.fast.lock);
    let now = ts_sec();
    let step = {
      let s = self.slow.lock();
      if s.next.is_some() {
        return;
      }
      Self::calc_step(s.step, s.ts, now)
    };
    if let Ok(seg) = self.fetch(step).await {
      let mut s = self.slow.lock();
      if s.next.is_none() {
        s.next = Some(seg);
      }
    }
  }

  fn try_switch_seg(&self) -> Option<u64> {
    let seg = {
      let mut s = self.slow.lock();
      if self.fast.id.load(Ordering::Acquire) < self.fast.max.load(Ordering::Acquire) {
        None
      } else {
        s.next.take()
      }
    };

    if let Some(seg) = seg {
      self.set_seg(seg);
      self.try_next()
    } else {
      self.try_next()
    }
  }

  pub async fn next(&'static self) -> Result<u64> {
    loop {
      // 快速路径（完全无锁）/ fast path (lock-free)
      if let Some(id) = self.try_next() {
        return Ok(id);
      }

      // 慢路径：尝试从缓存切换 / slow path: try switching from cache
      if let Some(id) = self.try_switch_seg() {
        self.spawn_fill();
        return Ok(id);
      }

      // 异步排队等待/执行获取 / Async queue and wait/execute fetch
      let _fetch_guard = self.fetch_lock.lock().await;

      // 再次尝试快速路径或缓存切换
      if let Some(id) = self.try_switch_seg() {
        self.spawn_fill();
        return Ok(id);
      }

      // 同步获取 / sync fetch
      let now = ts_sec();
      let step = {
        let s = self.slow.lock();
        Self::calc_step(s.step, s.ts, now).max(s.step)
      };
      let seg = self.fetch(step).await?;
      self.set_seg(seg);
      {
        let mut s = self.slow.lock();
        s.step = step;
        s.ts = now;
      }
      self.spawn_fill();
    }
  }
}
