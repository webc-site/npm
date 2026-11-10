use aok::{OK, Void};
use log::info;
use strjoin::Join;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test() -> Void {
  let li = ["hello", "world"];
  let joined = li.into_iter().join("\n");
  assert_eq!(joined, "hello\nworld");

  let li2 = ["hello".to_string(), "world".to_string()];
  let joined2 = li2.iter().join("\n");
  assert_eq!(joined2, "hello\nworld");

  let li3 = ["hello", "world"];
  let joined3 = li3.iter().join("\n");
  assert_eq!(joined3, "hello\nworld");

  let sep_string = String::from("\n");
  let joined4 = li3.iter().join(sep_string);
  assert_eq!(joined4, "hello\nworld");

  info!("> joined4: {:?}", joined4);
  OK
}
