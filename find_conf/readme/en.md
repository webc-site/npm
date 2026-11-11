# find_conf: Walk Up to Find a Config File

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Behavior](#behavior)
- [Error Handling](#error-handling)

## Overview

`find_conf` locates a configuration file or directory by walking upward from a
starting directory, one level at a time, until the filesystem root. It is the
same strategy used by tools like `git`, `eslint`, and `cargo` to discover
project configuration.

If nothing matches all the way to `/`, the function returns `None` instead of
an error.

## Features

- **Upward search**: checks the start directory, then each parent up to the root
- **Two entry points**: process current directory, or any explicit directory
- **Files or directories**: works for `conf.toml`, `.git`, `.env`, and so on
- **Nearest match wins**: the first hit while climbing is returned
- **Zero-allocation climbing**: reuses one `PathBuf` with `push` / `pop`
- **No panics**: all failures surface through `Result`
- **Absolute names respected**: an absolute `name` is checked as-is, once

## Installation

```sh
cargo add find_conf
```

## Usage

```rust
fn main() -> find_conf::Result<()> {
  // Search upward from the current process directory
  if let Some(path) = find_conf::find_conf("conf.toml")? {
    println!("found: {}", path.display());
  }

  // Search upward from a specific directory
  let found = find_conf::find_conf_in_dir("/srv/app/src", ".git")?;
  println!("{found:?}");
  Ok(())
}
```

Typical project layout:

```
/srv/app
├── conf.toml          <- found
└── src
    └── lib
        └── here       <- start directory
```

`find_conf_in_dir("/srv/app/src/lib/here", "conf.toml")` returns
`Some("/srv/app/conf.toml")`.

## API Reference

### `find_conf(name: impl AsRef<Path>) -> Result<Option<PathBuf>>`

Starts at `std::env::current_dir()` and climbs to the root.

### `find_conf_in_dir(dir: impl AsRef<Path>, name: impl AsRef<Path>) -> Result<Option<PathBuf>>`

Starts at `dir` and climbs to the root.

- A relative `dir` is converted to an absolute path with `std::path::absolute`
- A relative `name` is joined to each visited directory
- An absolute `name` is checked directly, without climbing
- The returned path is absolute for relative inputs

Both functions return `Ok(Some(path))` on the first match and `Ok(None)` when
no ancestor contains `name`.

## Behavior

```mermaid
graph TD
    A["find_conf_in_dir(dir, name)"] --> B{name 绝对?}
    B -->|Yes| C["try_exists(name)"]
    C --> D[Some/None]
    B -->|No| E["cur = absolute(dir)"]
    E --> F["cur.push(name)"]
    F --> G{try_exists?}
    G -->|Yes| H["Some(cur)"]
    G -->|No| I["cur.pop() 回到目录"]
    I --> J["cur.pop() 上跳一层"]
    J -->|成功| F
    J -->|已到根| K[None]
```

Notes:

- Symbolic links are followed, matching `Path::try_exists` semantics
- Directories and files are both valid matches
- The file is only checked for existence; it is never opened or parsed
- Permission errors and other IO failures are returned, not swallowed

## Error Handling

```rust
pub enum Error {
  Io(std::io::Error),
}
```

The only error source is IO: failing to read the process directory, or failing
to test a candidate path. "Not found" is never an error.

```rust
match find_conf::find_conf("conf.toml") {
  Ok(Some(path)) => println!("{}", path.display()),
  Ok(None) => eprintln!("no conf.toml in any parent"),
  Err(err) => eprintln!("io error: {err}"),
}
```
