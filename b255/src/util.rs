pub(crate) type Digit = u64;
pub(crate) type DoubleDigit = u128;
pub(crate) const BYTES: usize = 8;
pub(crate) const BITS: usize = BYTES * 8;

pub(crate) fn from_bytes_be(bytes: &[u8]) -> Vec<Digit> {
  if bytes.is_empty() {
    return Vec::new();
  }
  let mut digits = Vec::with_capacity(bytes.len().div_ceil(8));
  for chunk in bytes.rchunks(8) {
    if chunk.len() == 8 {
      let arr: [u8; 8] = unsafe { chunk.try_into().unwrap_unchecked() };
      digits.push(Digit::from_be_bytes(arr));
    } else {
      let mut val = 0;
      for &b in chunk {
        val = (val << 8) | b as Digit;
      }
      digits.push(val);
    }
  }
  digits
}

pub(crate) fn div_rem255(num: &mut Vec<Digit>) -> u8 {
  let mut rem = 0u64;
  for d in num.iter_mut().rev() {
    let (sum_low, overflow) = d.overflowing_add(rem);
    if !overflow {
      *d = rem * 0x0101010101010101 + sum_low / 255;
      rem = sum_low % 255;
    } else {
      *d = (rem + 1) * 0x0101010101010101;
      rem = sum_low + 1;
    }
  }
  while num.len() > 1 && unsafe { *num.get_unchecked(num.len() - 1) == 0 } {
    num.pop();
  }
  rem as u8
}
