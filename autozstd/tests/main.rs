use aok::{OK, Void};
use autozstd::{Type, decode, encode};

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test_empty() -> Void {
  let data = b"";
  let encoded = encode(data, None)?;
  assert_eq!(encoded.len(), 1);
  assert_eq!(encoded[0], Type::Raw as u8);

  let decoded = decode(&encoded)?;
  assert_eq!(decoded, data);
  OK
}

#[test]
fn test_small() -> Void {
  // Small data that shouldn't be compressed since compressed size + 1 byte header >= raw size + 1 byte header.
  let data = b"hello world";
  let encoded = encode(data, None)?;
  assert_eq!(encoded[0], Type::Raw as u8);
  assert_eq!(&encoded[1..], data);

  let decoded = decode(&encoded)?;
  assert_eq!(decoded, data);
  OK
}

#[test]
fn test_large() -> Void {
  // Large compressible data
  let data = b"hello world".repeat(100);
  let encoded = encode(&data, None)?;
  assert_eq!(encoded[0], Type::Zstd as u8);
  assert!(encoded.len() < data.len() + 1);

  // The output should NOT have the 4-byte magic number prefix
  // Magic number is [0x28, 0xB5, 0x2F, 0xFD]
  assert_ne!(&encoded[1..5], &[0x28, 0xB5, 0x2F, 0xFD]);

  let decoded = decode(&encoded)?;
  assert_eq!(decoded, data);

  // Test custom compression level
  let encoded_lvl_9 = encode(&data, Some(9))?;
  assert_eq!(encoded_lvl_9[0], Type::Zstd as u8);
  let decoded_lvl_9 = decode(&encoded_lvl_9)?;
  assert_eq!(decoded_lvl_9, data);
  OK
}

#[test]
fn test_errors() -> Void {
  // Empty slice decoding
  assert!(decode(&[]).is_err());

  // Invalid type byte decoding
  assert!(decode(&[99, 1, 2, 3]).is_err());
  OK
}
