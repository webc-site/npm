#![cfg_attr(docsrs, feature(doc_cfg))]

//! Ranking algorithm based on the Hacker News formula.
//!
//! ### Formula
//! ```text
//! score = success_rate / (age_hours + 2.0)^g * 1,000,000
//! ```
//! - `success_rate`: `ok / (ok + fail)`
//! - `age_hours`: hours elapsed since creation timestamp `create_ts` (in seconds).
//! - `g`: gravity, controls the speed of score decay.
//! - `+ 2.0`: prevents division by zero and dampens the score of very new items.
//! - `* 1,000,000.0`: scales the floating-point score to a `u64` integer.
//!
//! ---
//!
//! 基于 Hacker News 公式的排序算法。
//!
//! ### 公式
//! ```text
//! score = success_rate / (age_hours + 2.0)^g * 1,000,000
//! ```
//! - `success_rate`: `ok / (ok + fail)`（成功率）
//! - `age_hours`: 自创建时间戳 `create_ts`（单位为秒）以来流逝的小时数。
//! - `g`: 重力因子，控制得分随时间衰减的速度。
//! - `+ 2.0`: 防止除以零，并平滑极新项目的得分。
//! - `* 1,000,000.0`: 将浮点得分放大并转换为 `u64` 整数。

mod rank;
pub use rank::Rank;

#[cfg(feature = "const")]
/// Default global `Rank` instance.
///
/// ### Parameter Rationale:
/// - `base = 10000`: For new, untested items, the initial base score is set to 10000.
///   This ensures new items have a moderate starting score to get tested, without suppressing high-quality tested items.
/// - `g = 2.0`: Gravity decay factor (using the standard Hacker News value).
///   Ensures older items decay quickly so that the top items are always recently active and highly successful.
///
/// ---
///
/// 默认全局 `Rank` 实例。
///
/// ### 参数选择说明：
/// - `base = 10000`：针对全新未测试项目，初始基准得分设为 10000。
///   既能让新加入的代理有中等初始分以获得测试机会，又不会因分数过高而压制近期高成功率的已测试代理。
/// - `g = 2.0`：重力衰减因子（采用 Hacker News 标准值）。
///   让久未更新的代理分数快速衰减，确保排名靠前的代理均为近期活跃的优质代理。
pub const RANK: Rank = Rank::new(10000, 2.0);
