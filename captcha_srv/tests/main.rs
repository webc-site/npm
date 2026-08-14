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

#[test]
fn test_verify_token_b64() -> Void {
  use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
  let id = [1u8; 16];
  let b64_str = URL_SAFE_NO_PAD.encode(id);
  let decoded = URL_SAFE_NO_PAD.decode(&b64_str).unwrap();
  assert_eq!(decoded, id);
  info!("base64url encode/decode test passed");
  OK
}
