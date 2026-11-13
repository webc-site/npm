[English](#en) | [中文](#zh)

---

<a id="en"></a>
# ignore_dir: Directory Ignore Policy for Walkers

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Default Rules](#default-rules)

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
  - [`Ignore`](#ignore)
  - [`DefaultIgnore`](#defaultignore)
  - [`is_hidden(name: &OsStr) -> bool`](#is_hiddenname-osstr-bool)
  - [`IGNORE_DIR`](#ignore_dir)
- [Default Rules](#default-rules)
- [About](#about)

## Overview

`ignore_dir` gives directory walkers one shared ignore decision:

- every directory whose name starts with `.` is ignored
- common dependency and build output directories are ignored

Rules operate on directory names only. No config files, no filesystem access,
and the check stays cheap.

## Features

- **Zero dependencies**: standard library only
- **Hidden directories handled once**: no more listing `.git`, `.cache`, `.venv`
- **Common directories built in**: [`IGNORE_DIR`] covers `node_modules`, `target`, and more
- **Case-insensitive**: `NODE_MODULES` matches too
- **Pluggable policy**: implement `Ignore`, or pass a closure
- **No panics**: pure predicate functions

## Installation

```sh
cargo add ignore_dir
```

## Usage

```rust
use std::ffi::OsStr;
use ignore_dir::{DefaultIgnore, Ignore};

assert!(DefaultIgnore.ignore(OsStr::new(".git")));
assert!(DefaultIgnore.ignore(OsStr::new("node_modules")));
assert!(!DefaultIgnore.ignore(OsStr::new("src")));
```

With `walkdir`:

```rust
use ignore_dir::{DefaultIgnore, Ignore};
use walkdir::WalkDir;

let walk = WalkDir::new(".").into_iter().filter_entry(|entry| {
  entry.depth() == 0
    || !entry.file_type().is_dir()
    || !DefaultIgnore.ignore(entry.file_name())
});
```

Custom policy:

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

`Ignore` is implemented for `Fn(&OsStr) -> bool + Send + Sync`, so closures work
directly.

## API Reference

### `Ignore`

```rust
pub trait Ignore: Send + Sync {
  fn ignore(&self, name: &OsStr) -> bool;
}
```

`name` is the directory file name, without a path. `true` skips the directory
and all of its descendants.

### `DefaultIgnore`

The default policy:

```rust
pub struct DefaultIgnore;
```

Decision order:

1. [`is_hidden`] is true: ignore
2. name hits [`IGNORE_DIR`]: ignore
3. otherwise: keep

### `is_hidden(name: &OsStr) -> bool`

Whether the directory name starts with `.`.

### `IGNORE_DIR`

Common directories:

```text
node_modules  target  dist  build  out  vendor  bower_components
coverage  Pods  __pycache__  venv
```

Directories starting with `.` are handled by `is_hidden`; the list does not
repeat them.

## Default Rules

- Hidden directories such as `.git`, `.cache`, `.venv` are ignored automatically
- `node_modules`, `target`, `dist`, `build`, and similar are ignored automatically
- Matching is case-insensitive
- Whether the root directory is ignored is up to the walker; this crate only
  looks at the name it is given


## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI


---

<a id="zh"></a>
# ignore_dir: 目录遍历忽略策略

- [概述](#概述)
- [功能特性](#功能特性)
- [安装](#安装)
- [使用方法](#使用方法)
- [API 参考](#api-参考)
- [默认忽略规则](#默认忽略规则)

- [概述](#概述)
- [功能特性](#功能特性)
- [安装](#安装)
- [使用方法](#使用方法)
- [API 参考](#api-参考)
  - [`Ignore`](#ignore)
  - [`DefaultIgnore`](#defaultignore)
  - [`is_hidden(name: &OsStr) -> bool`](#is_hiddenname-osstr-bool)
  - [`IGNORE_DIR`](#ignore_dir)
- [默认忽略规则](#默认忽略规则)
- [关于](#关于)

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


## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式

