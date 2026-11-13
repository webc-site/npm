use aok::{OK, Result};
use b255::{DecodeError, FORBIDDEN_BYTE, decode, encode};

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test_empty() -> Result<()> {
  assert_eq!(encode(&[] as &[u8]), &[] as &[u8]);
  assert_eq!(decode(&[] as &[u8])?, &[] as &[u8]);
  OK
}

#[test]
fn test_simple() -> Result<()> {
  let original = ":-:您好:".as_bytes();
  let encoded = encode(original);
  assert!(!encoded.contains(&FORBIDDEN_BYTE));
  let decoded = decode(&encoded)?;
  assert_eq!(decoded, original);
  OK
}

#[test]
fn test_all_bytes() -> Result<()> {
  let original: Vec<u8> = (0..=u8::MAX).collect();
  let encoded = encode(&original);
  assert!(!encoded.contains(&FORBIDDEN_BYTE));
  let decoded = decode(&encoded)?;
  assert_eq!(decoded, &original[..]);
  OK
}

#[test]
fn test_zeros() -> Result<()> {
  for original in [[0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] {
    let encoded = encode(original);
    assert!(!encoded.contains(&FORBIDDEN_BYTE));
    let decoded = decode(&encoded)?;
    assert_eq!(decoded, original);
  }
  OK
}

#[test]
fn test_decode_error() -> Result<()> {
  let invalid_input = &[0, 1, FORBIDDEN_BYTE, 2]; // 包含禁止的字节
  let result = decode(invalid_input);
  assert!(matches!(
    result,
    Err(DecodeError::InvalidByte(FORBIDDEN_BYTE))
  ));
  OK
}

#[test]
fn test_overflow_branch() -> Result<()> {
  // 9字节大整数：高位为 254，低位为 u64::MAX (8字节的255)
  // 这会构建出 [u64::MAX, 254] 的 Digit 数组，大数除法中会触发溢出 (overflow = true) 分支
  let original = &[254, 255, 255, 255, 255, 255, 255, 255, 255];
  let encoded = encode(original);
  assert!(!encoded.contains(&FORBIDDEN_BYTE));
  let decoded = decode(&encoded)?;
  assert_eq!(decoded, original);
  OK
}
