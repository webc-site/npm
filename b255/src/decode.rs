use crate::{
  DecodeError, FORBIDDEN_BYTE,
  util::{BITS, Digit, DoubleDigit},
};

pub(crate) fn write_bytes_be(num: &[Digit], out: &mut [u8]) {
  if num.is_empty() || (num.len() == 1 && unsafe { *num.get_unchecked(0) } == 0) {
    return;
  }
  let len = out.len();
  let num_len = num.len();
  let last = unsafe { *num.get_unchecked(num_len - 1) };
  let last_bytes = 8 - (last.leading_zeros() / 8) as usize;

  for (i, &d) in num.iter().enumerate() {
    let mut val = d;
    if i == num_len - 1 {
      for j in 0..last_bytes {
        let idx = len - 1 - (i * 8 + j);
        unsafe {
          *out.get_unchecked_mut(idx) = val as u8;
        }
        val >>= 8;
      }
    } else {
      let bytes = val.to_be_bytes();
      let start_idx = len - (i + 1) * 8;
      unsafe {
        let target = out.get_unchecked_mut(start_idx..start_idx + 8);
        target.copy_from_slice(&bytes);
      }
    }
  }
}

pub(crate) fn mul_add255(num: &mut Vec<Digit>, add_val: Digit) {
  let mut carry = add_val as DoubleDigit;
  for d in num.iter_mut() {
    carry += *d as DoubleDigit * 255;
    *d = carry as Digit;
    carry >>= BITS;
  }
  if carry != 0 {
    num.push(carry as Digit);
  }
}

/// 将 b255 编码的字节切片解码回原始字节。
///
/// 解码算法是编码的逆过程：
/// 1. 将末尾的零（代表原始数据中的前导零）分离出来。
/// 2. 对核心数据中的每个字节，应用逆映射以获得base255的数字：
///    - 字节255被映射回`FORBIDDEN_BYTE`的值。
///    - 其他字节值保持不变。
/// 3. 使用霍纳法则，将base255的数字转换回base256的大整数。
/// 4. 将大整数转换回字节序列。
/// 5. 将前导零和解码后的主体组合起来得到最终结果。
///
/// 如果输入包含被禁止的字节 `FORBIDDEN_BYTE`，则返回 `DecodeError::InvalidByte`。
///
/// # 例子
///
/// ```
/// let encoded = b255::encode(b"hello");
/// let decoded = b255::decode(&encoded).unwrap();
/// assert_eq!(decoded, b"hello");
/// ```
pub fn decode(data: impl AsRef<[u8]>) -> Result<Vec<u8>, DecodeError> {
  let data = data.as_ref();
  if data.is_empty() {
    return Ok(Vec::new());
  }

  // 1. 计算并分离末尾的零（代表原始数据中的前导零）。
  let trailing_zeros = data.iter().rev().take_while(|&&b| b == 0).count();
  let core_data = &data[..data.len() - trailing_zeros];

  if core_data.is_empty() {
    return Ok(vec![0; trailing_zeros]);
  }

  let mut num: Vec<Digit> = Vec::with_capacity(core_data.len().div_ceil(8));
  num.push(0);

  // 2. 从 base255 转换到 base256。
  // 输入是小端序 [d0, d1, ..., dn]，我们需要从 dn 开始处理。
  for &byte in core_data.iter().rev() {
    // 逆向映射字节到数字
    let digit = match byte {
      FORBIDDEN_BYTE => return Err(DecodeError::InvalidByte(FORBIDDEN_BYTE)),
      255 => FORBIDDEN_BYTE,
      b => b,
    };
    // 使用霍纳法则进行基数转换。
    mul_add255(&mut num, digit as Digit);
  }

  // 3. 将大数转换回字节向量。
  let num_len = num.len();
  let last = unsafe { *num.get_unchecked(num_len - 1) };
  let last_bytes = 8 - (last.leading_zeros() / 8) as usize;
  let len = (num_len - 1) * 8 + last_bytes;

  let total_len = trailing_zeros + len;
  let mut result = vec![0; total_len];
  write_bytes_be(&num, unsafe { result.get_unchecked_mut(trailing_zeros..) });

  Ok(result)
}
