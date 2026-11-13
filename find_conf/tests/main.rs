use std::{
  collections::{BTreeSet, HashSet},
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
  // 单名字按路径拼接探测，绝对路径只查一次
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
fn single_name_nested() -> Void {
  let tmp = Tmp::new("nested_name")?;
  let root = tmp.path();
  let deep = root.join("a/b");
  fs::create_dir_all(&deep)?;
  let conf = root.join("sub/conf.toml");
  fs::create_dir_all(root.join("sub"))?;
  fs::write(&conf, "")?;

  info!("> single_name_nested");
  // 多级名字按 join 探测，且不破坏上跳
  assert_eq!(
    find_conf::find_conf_in_dir(&deep, "sub/conf.toml")?,
    Some(conf.clone())
  );
  assert_eq!(
    find_conf::find_conf_in_dir(&deep, "sub/missing.toml")?,
    None
  );
  OK
}

#[test]
fn single_name_dot() -> Void {
  let tmp = Tmp::new("dot")?;
  let deep = tmp.path().join("a/b");
  fs::create_dir_all(&deep)?;

  info!("> single_name_dot");
  // "." 命中当前层，且不破坏后续上跳
  assert_eq!(
    find_conf::find_conf_in_dir(&deep, ".")?,
    Some(deep.join("."))
  );
  // 非普通组件走 join 探测，未命中也要正常上跳到根
  assert_eq!(find_conf::find_conf_in_dir(&deep, "./nope")?, None);
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

#[test]
fn multi_name_nearest_dir() -> Void {
  let tmp = Tmp::new("multi")?;
  let root = tmp.path();
  let deep = root.join("a/b");
  fs::create_dir_all(&deep)?;
  // 仓库根标记，仅 root 层有
  fs::create_dir(root.join(".git"))?;

  info!("> multi_name_nearest_dir");
  assert_eq!(
    find_conf::find_conf_in_dir(&deep, [".git", ".hg", ".svn"])?,
    Some(root.join(".git"))
  );
  OK
}

#[test]
fn multi_name_same_dir() -> Void {
  let tmp = Tmp::new("order")?;
  let root = tmp.path();
  let deep = root.join("a");
  fs::create_dir_all(&deep)?;
  fs::create_dir(root.join(".hg"))?;

  info!("> multi_name_same_dir");
  // 同层命中任一个即可，目录条目顺序不作保证
  let hit = find_conf::find_conf_in_dir(&deep, [".git", ".hg"])?;
  assert_eq!(hit, Some(root.join(".hg")));
  OK
}

#[test]
fn multi_name_collections() -> Void {
  let tmp = Tmp::new("coll")?;
  let root = tmp.path();
  let deep = root.join("x/y");
  fs::create_dir_all(&deep)?;
  let conf = root.join("i18n");
  fs::create_dir(&conf)?;

  info!("> multi_name_collections");
  let set = HashSet::from([PathBuf::from("nope"), PathBuf::from("i18n")]);
  assert_eq!(
    find_conf::find_conf_in_dir(&deep, &set)?,
    Some(conf.clone())
  );

  let vec = vec!["nope", "i18n"];
  assert_eq!(
    find_conf::find_conf_in_dir(&deep, &vec)?,
    Some(conf.clone())
  );

  let bt: BTreeSet<&str> = ["nope", "i18n"].into();
  assert_eq!(find_conf::find_conf_in_dir(&deep, bt)?, Some(conf.clone()));

  let slice: &[&str] = &["nope", "i18n"];
  assert_eq!(find_conf::find_conf_in_dir(&deep, slice)?, Some(conf));
  OK
}

#[test]
fn multi_name_absolute_ignored() -> Void {
  let tmp = Tmp::new("abs_set")?;
  fs::write(tmp.path().join("rel.toml"), "")?;
  let abs = tmp.path().join("abs.toml");
  fs::write(&abs, "")?;
  let set = vec![PathBuf::from("rel.toml"), abs];

  info!("> multi_name_absolute_ignored");
  // 集合中的绝对路径忽略，只命中相对名字
  assert_eq!(
    find_conf::find_conf_in_dir(tmp.path(), &set)?,
    Some(tmp.path().join("rel.toml"))
  );
  OK
}

#[test]
fn empty_name_set() -> Void {
  let tmp = Tmp::new("empty")?;
  let deep = tmp.path().join("a");
  fs::create_dir_all(&deep)?;

  info!("> empty_name_set");
  let empty: [&str; 0] = [];
  assert_eq!(find_conf::find_conf_in_dir(&deep, empty)?, None);
  OK
}
