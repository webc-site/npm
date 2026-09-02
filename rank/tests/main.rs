use aok::{OK, Void};
use log::info;
#[cfg(feature = "const")]
use rank::RANK;
use rank::Rank;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test() -> Void {
  let r = Rank::new(100, 1.8);
  let now = coarsetime::Clock::now_since_epoch().as_secs();
  let recent = coarsetime::Clock::recent_since_epoch().as_secs();
  println!("now_since_epoch: {now}, recent_since_epoch: {recent}");
  let score = r.rank(80, 20, now - 3600);
  info!("score: {score}");
  assert!(score > 0);

  #[cfg(feature = "const")]
  {
    let score2 = RANK.rank(80, 20, now - 3600);
    info!("const RANK score: {score2}");
    assert!(score2 > 0);
  }

  OK
}
