use aok::{OK, Void};
use rustls::crypto::ring::default_provider;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
  let _ = default_provider().install_default();
}

#[test]
fn test() -> Void {
  OK
}
