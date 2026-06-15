use coarsetime::Clock;

pub struct Rank {
  pub base: u64,
  pub g: f64,
}

impl Rank {
  pub const fn new(base: u64, g: f64) -> Self {
    Self {
      base,
      g,
    }
  }

  /// Calculate the ranking score based on the Hacker News formula.
  ///
  /// * `ok`: number of successful attempts.
  /// * `fail`: number of failed attempts.
  /// * `create_ts`: creation timestamp in seconds.
  ///
  /// ---
  ///
  /// 根据 Hacker News 公式计算排序得分。
  ///
  /// * `ok`：成功次数。
  /// * `fail`：失败次数。
  /// * `create_ts`：创建时间戳（单位：秒）。
  pub fn rank(&self, ok: u64, fail: u64, create_ts: u64) -> u64 {
    let total = ok + fail;
    if total == 0 {
      return self.base;
    }
    let mut now = Clock::recent_since_epoch().as_secs();
    if now == 0 {
      now = Clock::now_since_epoch().as_secs();
    }
    let age_seconds = now.saturating_sub(create_ts);
    let age_hours = (age_seconds as f64) / 3600.0;

    let x = age_hours + 2.0;
    let age_factor = if self.g == 2.0 {
      x * x
    } else if self.g == 1.0 {
      x
    } else {
      x.powf(self.g)
    };

    let denominator = (total as f64) * age_factor;
    let scaled_ok = (ok as f64) * 1_000_000.0;
    (scaled_ok / denominator) as u64
  }
}
