use b255::{FORBIDDEN_BYTE, decode, encode};

fn main() -> Result<(), b255::DecodeError> {
  let original = b"redis:key:with:colon";
  println!("Original bytes: {:?}", original);

  // 1. 进行 base255 编码
  let encoded = encode(original);
  println!("Encoded bytes : {:?}", encoded);

  // 验证编码后不包含禁止的冒号字节
  assert!(!encoded.contains(&FORBIDDEN_BYTE));

  // 2. 解码还原数据
  let decoded = decode(&encoded)?;
  println!("Decoded bytes : {:?}", decoded);

  assert_eq!(decoded, original);
  println!("Success!");

  // 3. 演示异常字节校验
  let invalid_input = &[FORBIDDEN_BYTE];
  let result = decode(invalid_input);
  assert!(result.is_err());
  println!("Invalid byte detection verified.");

  Ok(())
}
