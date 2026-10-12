use aok::{OK, Void};
use blake3_cipher::Cipher;
use log::info;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test() -> Void {
  let cipher = Cipher::new(b"my super secret password");
  let plaintext =
    "Hello, this is a secret message we want to encrypt. 你好，这是一条我们想要加密的秘密消息！"
      .as_bytes();
  let nonce = b"test nonce";

  let encrypted = cipher.encrypt(nonce, plaintext);
  info!("encrypted data len: {}", encrypted.len());

  let decrypted = cipher.decrypt(nonce, &encrypted);
  assert_eq!(plaintext, decrypted.as_slice());

  // Test decrypting with a wrong password
  let wrong_cipher = Cipher::new(b"wrong password");
  let wrong_decrypted = wrong_cipher.decrypt(nonce, &encrypted);
  assert_ne!(plaintext, wrong_decrypted.as_slice());

  // Test with exact 32-byte key
  let exact_key = [7u8; 32];
  let cipher_32 = Cipher::new(exact_key);
  let enc_32 = cipher_32.encrypt(nonce, plaintext);
  let dec_32 = cipher_32.decrypt(nonce, &enc_32);
  assert_eq!(plaintext, dec_32.as_slice());

  OK
}
