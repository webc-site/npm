use aok::{OK, Void};
use log::info;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test() -> Void {
  let tag = hash_tag_id::hash_tag_id(123);
  info!("> hash_tag_id(123): {:?}", tag);
  assert_eq!(&*tag, &[b'{', 123, b'}']);

  let tag = hash_tag_id::hash_tag_id(0);
  info!("> hash_tag_id(0): {:?}", tag);
  assert_eq!(&*tag, b"{}");

  let tag = hash_tag_id::hash_tag_id(256);
  info!("> hash_tag_id(256): {:?}", tag);
  assert_eq!(&*tag, &[b'{', 0, 1, b'}']);
  OK
}
