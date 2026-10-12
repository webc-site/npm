use std::sync::atomic::Ordering;

use fred::interfaces::HashesInterface;
use xkv::R;

use crate::{KVID_KEY, KvId, PRELOAD_SEC, Result, STEP_MAX, STEP_MIN, Seg};

impl KvId {
  #[inline]
  pub(crate) fn try_next(&self) -> Option<u64> {
    let mut id = self.fast.id.load(Ordering::Acquire);
    loop {
      let max = self.fast.max.load(Ordering::Acquire);

      if id >= max {
        return None;
      }
      let nid = id + 1;
      match self
        .fast
        .id
        .compare_exchange_weak(id, nid, Ordering::AcqRel, Ordering::Relaxed)
      {
        Ok(_) => return Some(nid),
        Err(actual) => id = actual,
      }
    }
  }

  // 根据上次步长和时间间隔计算新步长
  // calc new step based on prev step and elapsed time
  pub(crate) fn calc_step(step: u64, ts: u64, now: u64) -> u64 {
    if ts == 0 {
      return STEP_MIN;
    }
    let elapsed = now.saturating_sub(ts);
    if elapsed == 0 {
      // 间隔为0说明消费极快，快速增长 / zero elapsed means high load, grow fast
      // 1→64 then double / 1→64 然后翻倍
      return if step < 64 {
        64
      } else {
        (step * 2).min(STEP_MAX)
      };
    }
    (step * PRELOAD_SEC / elapsed).clamp(STEP_MIN, STEP_MAX)
  }

  pub(crate) async fn fetch(&self, step: u64) -> Result<Seg> {
    let incr = step as i64;
    let max = R
      .hincrby::<u64, _, _>(KVID_KEY, self.name.as_str(), incr)
      .await?;
    Ok(Seg {
      id: max - step,
      max,
    })
  }

  #[inline]
  pub(crate) fn set_seg(&self, seg: Seg) {
    self.fast.id.store(seg.id, Ordering::Release);
    self.fast.max.store(seg.max, Ordering::Release);
  }
}
