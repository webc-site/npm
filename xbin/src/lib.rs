#![no_std]

extern crate alloc;

use alloc::vec::Vec;
use core::ptr::copy_nonoverlapping;

/// 将实现了 `AsRef<[u8]>` 的已知大小数组 `[T; N]` 中的所有字节切片拼接成一个 `Vec<u8>`。
///
/// 为了实现极致的性能与 Exception Safety (异常安全)，该实现具备以下特征：
/// 1. 基于编译期常量泛型 `const N: usize`，静态确定元素数量，省去运行时的动态逻辑与额外临时分配。
/// 2. 若数组为空（N == 0），则触发静态分支剪枝并安全地返回空 `Vec`。
/// 3. 精确预分配最终 `Vec<u8>` 的容量，并使用 `copy_nonoverlapping` 进行高速零越界检查的数据拷贝。
#[cold]
#[inline(never)]
fn panic_on_len_mismatch() -> ! {
  panic!("xbin::concat: element length changed during iteration");
}

pub fn concat<T: AsRef<[u8]>, const N: usize>(array: [T; N]) -> Vec<u8> {
  if N == 0 {
    return Vec::new();
  }

  let total_len = array.iter().map(|item| item.as_ref().len()).sum();

  let mut r = Vec::with_capacity(total_len);
  let mut ptr = r.as_mut_ptr();
  let mut bytes_written = 0;

  unsafe {
    for item in array {
      let slice = item.as_ref();
      let slice_len = slice.len();

      if bytes_written + slice_len > total_len {
        panic_on_len_mismatch();
      }

      copy_nonoverlapping(slice.as_ptr(), ptr, slice_len);
      ptr = ptr.add(slice_len);
      bytes_written += slice_len;
    }
    r.set_len(bytes_written);
  }
  r
}

#[macro_export]
macro_rules! concat {
  ($($i:expr),*$(,)?)=>{
    $crate::concat([
      $($i.as_ref()),*
    ])
  }
}
