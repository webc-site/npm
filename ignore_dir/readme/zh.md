# ignore_dir: 目录遍历忽略策略

- [概述](#概述)
- [功能特性](#功能特性)
- [安装](#安装)
- [使用方法](#使用方法)
- [API 参考](#api-参考)
- [默认忽略规则](#默认忽略规则)

## 概述

`ignore_dir` 给目录遍历器提供统一的忽略判断：

- 以 `.` 开头的目录一律忽略
- 常见依赖、构建产物目录忽略

规则只处理目录名，不读配置、不访问文件系统，判断开销极小。

## 功能特性

- **零依赖**：只用标准库
- **隐藏目录统一处理**：不再逐个配置 `.git`、`.cache`、`.venv`
- **常见目录内置**：[`IGNORE_DIR`] 覆盖 `node_modules`、`target` 等
- **大小写不敏感**：`NODE_MODULES` 同样命中
- **可替换策略**：实现 `Ignore`，或直接传闭包
- **不 panic**：纯判断函数

## 安装

```sh
cargo add ignore_dir
```

## 使用方法

```rust
use std::ffi::OsStr;
use ignore_dir::{DefaultIgnore, Ignore};

assert!(DefaultIgnore.ignore(OsStr::new(".git")));
assert!(DefaultIgnore.ignore(OsStr::new("node_modules")));
assert!(!DefaultIgnore.ignore(OsStr::new("src")));
```

配合 `walkdir`：

```rust
use ignore_dir::{DefaultIgnore, Ignore};
use walkdir::WalkDir;

let walk = WalkDir::new(".").into_iter().filter_entry(|entry| {
  entry.depth() == 0
    || !entry.file_type().is_dir()
    || !DefaultIgnore.ignore(entry.file_name())
});
```

自定义策略：

```rust
use std::ffi::OsStr;
use ignore_dir::{DefaultIgnore, Ignore};

struct MyIgnore;

impl Ignore for MyIgnore {
  fn ignore(&self, name: &OsStr) -> bool {
    DefaultIgnore.ignore(name) || name == "fixtures"
  }
}
```

`Ignore` 已为 `Fn(&OsStr) -> bool + Send + Sync` 实现，闭包可直接传入。

## API 参考

### `Ignore`

```rust
pub trait Ignore: Send + Sync {
  fn ignore(&self, name: &OsStr) -> bool;
}
```

`name` 是目录的文件名，不含路径。返回 `true` 表示跳过该目录及子项。

### `DefaultIgnore`

默认策略：

```rust
pub struct DefaultIgnore;
```

判断顺序：

1. [`is_hidden`] 为真，忽略
2. 命中 [`IGNORE_DIR`]，忽略
3. 否则保留

### `is_hidden(name: &OsStr) -> bool`

目录名是否以 `.` 开头。

### `IGNORE_DIR`

常见目录列表：

```text
node_modules  target  dist  build  out  vendor  bower_components
coverage  Pods  __pycache__  venv
```

以 `.` 开头的目录由 `is_hidden` 统一处理，列表不重复收录。

## 默认忽略规则

- `.git`、`.cache`、`.venv` 等隐藏目录自动忽略
- `node_modules`、`target`、`dist`、`build` 等自动忽略
- 大小写不敏感
- 根目录是否忽略由遍历器自行决定，本库只看传入的目录名
