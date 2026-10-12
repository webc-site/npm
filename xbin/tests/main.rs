use std::{
  array, panic,
  panic::{AssertUnwindSafe, catch_unwind},
  sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
  },
};

use aok::{OK, Result};
use log::info;
use static_init::constructor;
use xbin::concat;

#[constructor(0)]
extern "C" fn init() {
  log_init::init()
}

#[test]
fn test_macro() -> Result<()> {
  let s1 = "123";
  let s2 = [4u8, 5, 6];
  let s3 = vec![7u8, 8, 9];
  let result = concat!(s1, s2, s3);
  assert_eq!(result, b"123\x04\x05\x06\x07\x08\x09");
  info!("Macro test ok");
  OK
}

#[test]
fn test_concat_empty() -> Result<()> {
  let empty: [Vec<u8>; 0] = [];
  let result = concat(empty);
  assert!(result.is_empty());
  info!("Empty array test ok");
  OK
}

#[test]
fn test_concat_small() -> Result<()> {
  let data = [vec![1u8, 2], vec![3, 4, 5], vec![6]];
  let result = concat(data);
  assert_eq!(result, vec![1, 2, 3, 4, 5, 6]);
  info!("Small array test ok");
  OK
}

#[test]
fn test_concat_large() -> Result<()> {
  let data: [Vec<u8>; 20] = array::from_fn(|i| vec![i as u8]);
  let result = concat(data);
  let expected: Vec<u8> = (0..20).collect();
  assert_eq!(result, expected);
  info!("Large array test ok");
  OK
}

struct PanicItem {
  data: Vec<u8>,
  panic_on_first_call: bool,
  panic_on_second_call: bool,
  call_count: AtomicUsize,
  drop_counter: Arc<AtomicUsize>,
}

impl PanicItem {
  fn new(
    data: Vec<u8>,
    panic_on_first_call: bool,
    panic_on_second_call: bool,
    drop_counter: Arc<AtomicUsize>,
  ) -> Self {
    Self {
      data,
      panic_on_first_call,
      panic_on_second_call,
      call_count: AtomicUsize::new(0),
      drop_counter,
    }
  }
}

impl AsRef<[u8]> for PanicItem {
  fn as_ref(&self) -> &[u8] {
    let count = self.call_count.fetch_add(1, Ordering::SeqCst);
    if self.panic_on_first_call && count == 0 {
      panic!("intentional panic on first call");
    }
    if self.panic_on_second_call && count == 1 {
      panic!("intentional panic on second call");
    }
    &self.data
  }
}

impl Drop for PanicItem {
  fn drop(&mut self) {
    self.drop_counter.fetch_add(1, Ordering::SeqCst);
  }
}

#[test]
fn test_exception_safety_sum_phase() -> Result<()> {
  let drop_counter = Arc::new(AtomicUsize::new(0));

  let data = [
    PanicItem::new(vec![1], false, false, drop_counter.clone()),
    PanicItem::new(vec![2], false, false, drop_counter.clone()),
    PanicItem::new(vec![3], true, false, drop_counter.clone()),
    PanicItem::new(vec![4], false, false, drop_counter.clone()),
  ];

  let original_hook = panic::take_hook();
  panic::set_hook(Box::new(|_| {}));

  let result = catch_unwind(AssertUnwindSafe(|| {
    let _ = concat(data);
  }));

  panic::set_hook(original_hook);

  assert!(result.is_err());
  assert_eq!(drop_counter.load(Ordering::SeqCst), 4);
  info!("Exception safety sum phase test ok");
  OK
}

#[test]
fn test_exception_safety_copy_phase() -> Result<()> {
  let drop_counter = Arc::new(AtomicUsize::new(0));

  let data = [
    PanicItem::new(vec![1], false, false, drop_counter.clone()),
    PanicItem::new(vec![2], false, false, drop_counter.clone()),
    PanicItem::new(vec![3], false, true, drop_counter.clone()),
    PanicItem::new(vec![4], false, false, drop_counter.clone()),
  ];

  let original_hook = panic::take_hook();
  panic::set_hook(Box::new(|_| {}));

  let result = catch_unwind(AssertUnwindSafe(|| {
    let _ = concat(data);
  }));

  panic::set_hook(original_hook);

  assert!(result.is_err());
  assert_eq!(drop_counter.load(Ordering::SeqCst), 4);
  info!("Exception safety copy phase test ok");
  OK
}
