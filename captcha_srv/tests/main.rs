use aok::{OK, Void};
use captcha_srv::{R_CAPTCHA, captcha_key};
use log::info;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test_vb_encode() -> Void {
  let mut buf = Vec::new();
  vb::e(100, &mut buf);
  assert_eq!(buf, vec![100]);

  buf.clear();
  vb::e(300, &mut buf);
  assert_eq!(buf, vec![172, 2]);

  info!("vb_encode test passed");
  OK
}

#[test]
fn test_captcha_key() -> Void {
  let id = [1u8; 16];
  let key = captcha_key(&id);
  assert_eq!(&key[..8], R_CAPTCHA);
  assert_eq!(&key[8..24], &id);

  info!("captcha_key test passed");
  OK
}
