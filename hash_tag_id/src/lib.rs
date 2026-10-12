use std::{
  alloc::{Layout, alloc, handle_alloc_error},
  ptr::{copy_nonoverlapping, slice_from_raw_parts_mut, write},
};

const PREFIX: u8 = b'{';
const SUFFIX: u8 = b'}';
const BITS_IN_U64: u32 = 64;
const BITS_IN_BYTE: u32 = 8;
const SHIFT: usize = 3;
const ADDEND: u32 = BITS_IN_U64 + BITS_IN_BYTE - 1;
const WRAPPER_LEN: usize = 2;
const ALIGN_U8: usize = 1;

pub fn hash_tag_id(id: u64) -> Box<[u8]> {
  let len = ((ADDEND - id.leading_zeros()) as usize) >> SHIFT;
  let total_len = len + WRAPPER_LEN;
  unsafe {
    let layout = Layout::from_size_align_unchecked(total_len, ALIGN_U8);
    let ptr = alloc(layout);
    if ptr.is_null() {
      handle_alloc_error(layout);
    }
    write(ptr, PREFIX);
    copy_nonoverlapping(id.to_le_bytes().as_ptr(), ptr.add(1), len);
    write(ptr.add(total_len - 1), SUFFIX);
    Box::from_raw(slice_from_raw_parts_mut(ptr, total_len))
  }
}
