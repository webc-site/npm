use std::{
  env::temp_dir,
  fs,
  path::{Path, PathBuf},
  process,
};

use aok::{OK, Result, Void};
use log::info;

#[ctor::ctor(unsafe)]
fn _log_init() {
  log_init::init();
}

// 每个测试独立临时目录，避免并发冲突
struct Tmp(PathBuf);

impl Tmp {
  fn new(tag: &str) -> Result<Self> {
    let dir = temp_dir().join(format!("find_conf_{}_{tag}", process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir)?;
    Ok(Self(dir))
  }

  fn path(&self) -> &Path {
    &self.0
  }
}

impl Drop for Tmp {
  fn drop(&mut self) {
    let _ = fs::remove_dir_all(&self.0);
  }
}

#[test]
fn nested_upward() -> Void {
  let tmp = Tmp::new("nested")?;
  let root = tmp.path();
  let deep = root.join("a/b/c");
  fs::create_dir_all(&deep)?;
  let conf = root.join("conf.toml");
  fs::write(&conf, "")?;

  info!("> nested_upward");
  assert_eq!(find_conf::find_conf_in_dir(&deep, "conf.toml")?, Some(conf));
  OK
}

#[test]
fn nearest_wins() -> Void {
  let tmp = Tmp::new("nearest")?;
  let root = tmp.path();
  let mid = root.join("a");
  let deep = mid.join("b");
  fs::create_dir_all(&deep)?;
  fs::write(root.join("conf.toml"), "")?;
  let near = mid.join("conf.toml");
  fs::write(&near, "")?;

  info!("> nearest_wins");
  assert_eq!(find_conf::find_conf_in_dir(&deep, "conf.toml")?, Some(near));
  OK
}

#[test]
fn not_found() -> Void {
  let tmp = Tmp::new("missing")?;
  let deep = tmp.path().join("a/b");
  fs::create_dir_all(&deep)?;

  info!("> not_found");
  assert_eq!(
    find_conf::find_conf_in_dir(&deep, "no_such_conf_xyz")?,
    None
  );
  OK
}

#[test]
fn find_directory() -> Void {
  let tmp = Tmp::new("dir")?;
  let root = tmp.path();
  let deep = root.join("x/y");
  fs::create_dir_all(&deep)?;
  fs::create_dir(root.join(".git"))?;

  info!("> find_directory");
  assert_eq!(
    find_conf::find_conf_in_dir(&deep, ".git")?,
    Some(root.join(".git"))
  );
  OK
}

#[test]
fn absolute_name() -> Void {
  let tmp = Tmp::new("abs")?;
  let conf = tmp.path().join("conf.toml");
  fs::write(&conf, "")?;

  info!("> absolute_name");
  assert_eq!(
    find_conf::find_conf_in_dir(tmp.path(), &conf)?,
    Some(conf.clone())
  );
  assert_eq!(
    find_conf::find_conf_in_dir(tmp.path(), tmp.path().join("nope"))?,
    None
  );
  OK
}

#[test]
fn relative_dir() -> Void {
  info!("> relative_dir");
  // "." 表示进程目录，向上必能命中 crate 根
  let found = find_conf::find_conf_in_dir(".", "Cargo.toml")?;
  assert!(found.is_some(), "Cargo.toml 应能被找到");
  assert!(found.unwrap().is_absolute());
  OK
}

#[test]
fn current_dir_api() -> Void {
  info!("> current_dir_api");
  // 测试进程目录为 crate 根，必含 Cargo.toml
  let found = find_conf::find_conf("Cargo.toml")?;
  assert!(found.is_some(), "Cargo.toml 应能被找到");
  assert!(found.unwrap().is_file());
  OK
}
