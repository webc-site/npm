# ignore_dir: Directory Ignore Policy for Walkers

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Default Rules](#default-rules)

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
