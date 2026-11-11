use std::{
  collections::BTreeSet,
  ffi::OsStr,
  fs,
  path::{Path, PathBuf},
};

use aok::{OK, Void};
use find_ext::{FindExt, Receiver};
use tempfile::TempDir;

#[ctor::ctor(unsafe)]
fn _log_init() {
  log_init::init();
}

fn touch(root: &Path, rel: &str) {
  let path = root.join(rel);
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).expect("create dir");
  }
  fs::write(path, b"x").expect("write file");
}

fn collect(rx: Receiver) -> BTreeSet<PathBuf> {
  let mut set = BTreeSet::new();
  while let Ok(path) = rx.recv() {
    set.insert(path);
  }
  set
}

fn rel_set(root: &Path, set: BTreeSet<PathBuf>) -> BTreeSet<String> {
  set
    .into_iter()
    .map(|path| {
      path
        .strip_prefix(root)
        .expect("in root")
        .to_string_lossy()
        .into_owned()
    })
    .collect()
}

fn expect(root: &Path, ext_li: &[&str], want: &[&str]) -> Void {
  let rx = FindExt::new(ext_li).find(root)?;
  let got = rel_set(root, collect(rx));
  let want: BTreeSet<String> = want.iter().map(|item| item.to_string()).collect();
  assert_eq!(got, want);
  OK
}

#[test]
fn default_ignore() -> Void {
  let tmp = TempDir::new()?;
  let root = tmp.path();

  touch(root, "a.rs");
  touch(root, "b.toml");
  touch(root, "c.txt");
  touch(root, "noext");
  touch(root, "archive.tar.gz");
  touch(root, "sub/d.rs");
  touch(root, "sub/e.yaml");
  touch(root, "node_modules/x.rs");
  touch(root, "target/y.rs");
  touch(root, ".hidden/z.rs");

  expect(
    root,
    &["rs", "toml", "yaml", "gz"],
    &["a.rs", "archive.tar.gz", "b.toml", "sub/d.rs", "sub/e.yaml"],
  )
}

#[test]
fn last_dot_and_hidden_file() -> Void {
  let tmp = TempDir::new()?;
  let root = tmp.path();

  touch(root, "a.b.rs");
  touch(root, ".env");
  touch(root, "trailing.");

  expect(root, &["rs", "env"], &[".env", "a.b.rs"])
}

#[test]
fn custom_ignore() -> Void {
  let tmp = TempDir::new()?;
  let root = tmp.path();

  touch(root, "keep/a.yaml");
  touch(root, "skipme/b.yaml");

  let rx = FindExt::new_with_ignore(["yaml"], |name: &OsStr| name == "skipme").find(root)?;
  let got = rel_set(root, collect(rx));

  let want: BTreeSet<String> = ["keep/a.yaml".to_string()].into_iter().collect();
  assert_eq!(got, want);
  OK
}

#[test]
fn missing_dir_yields_nothing() -> Void {
  let tmp = TempDir::new()?;
  let rx = FindExt::new(["rs"]).find(tmp.path().join("not_exist"))?;
  assert!(collect(rx).is_empty());
  OK
}
