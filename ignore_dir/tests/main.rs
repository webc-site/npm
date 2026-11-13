use std::ffi::OsStr;

use aok::{OK, Void};
use ignore_dir::{DefaultIgnore, IGNORE_DIR, Ignore, is_hidden};

fn ignored(name: &str) -> bool {
  DefaultIgnore.ignore(OsStr::new(name))
}

#[test]
fn hidden() -> Void {
  assert!(is_hidden(OsStr::new(".git")));
  assert!(ignored(".git"));
  assert!(ignored(".cache"));
  assert!(!ignored("git"));
  OK
}

#[test]
fn common_dir() -> Void {
  for name in [
    "node_modules",
    "target",
    "dist",
    "build",
    "Pods",
    "__pycache__",
  ] {
    assert!(ignored(name), "{name}");
  }
  assert!(ignored("NODE_MODULES"));
  assert!(ignored("TARGET"));
  assert!(!ignored("src"));
  assert!(!ignored("targets"));
  assert!(!ignored("1234"));
  assert!(!ignored(""));
  OK
}

#[test]
fn no_duplicate_hidden_config() -> Void {
  assert!(IGNORE_DIR.iter().all(|name| !name.starts_with('.')));
  OK
}

#[test]
fn closure() -> Void {
  let ignore = |name: &OsStr| name == "fixtures";
  assert!(ignore.ignore(OsStr::new("fixtures")));
  assert!(!ignore.ignore(OsStr::new("src")));
  OK
}
