use aok::{OK, Void};


#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
  let _ = rustls::crypto::ring::default_provider().install_default();
}

#[test]
fn test() -> Void {
  OK
}
