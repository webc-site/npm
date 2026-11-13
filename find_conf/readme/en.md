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
- **Nearest match wins**: the nearest directory holding a match wins
- **Single name is one stat per level**: no directory listing at all
- **Sets list each level once**: every entry is tested with `Name::contains`
- **No panics**: all failures surface through `Result`
- **Multiple names**: pass a slice, array, `Vec`, or set to match several
  entries per directory, e.g. `.git` / `.hg` / `.svn`

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

Pass several candidates to find a repository root regardless of VCS:

```rust
let root = find_conf::find_conf([".git", ".hg", ".svn"])?;
```

## API Reference

### `find_conf(name: impl Name) -> Result<Option<PathBuf>>`

Starts at `std::env::current_dir()` and climbs to the root.

### `find_conf_in_dir(dir: impl AsRef<Path>, name: impl Name) -> Result<Option<PathBuf>>`

Starts at `dir` and climbs to the root.

Starts at `dir` and climbs to the root.

- A relative `dir` is converted to an absolute path with `std::path::absolute`
- A single name is joined to each ancestor and checked with `try_exists`, so
  nested (`sub/conf.toml`) and absolute names work
- A set lists each ancestor once and tests every entry name with
  `Name::contains`; names are entry names, so paths never match
- The nearest directory with a hit wins; a missing `dir` is skipped upward
- The returned path is absolute for relative inputs

Both functions return `Ok(Some(path))` on the first match and `Ok(None)` when
no ancestor holds any of the names. IO errors (permissions included) are
returned, never skipped.

### `Name`: candidates

`name` accepts a single name or a whole set of candidates:

| Type | Path | Example |
| --- | --- | --- |
| single | joined per level, `stat` | `"conf.toml"`, `"sub/conf.toml"` |
| slice / array | entry names, one listing per level | `[".git", ".hg", ".svn"]` |
| `Vec` | entry names | `vec![".i18n", "i18n"]` |
| `HashSet` / `BTreeSet` | entry names | `HashSet::from([".git", ".hg"])` |

Own types implement two methods:

```rust
fn contains(&self, name: &Path) -> bool;
fn single(&self) -> Option<&Path>; // optional: enables the stat fast path
fn is_empty(&self) -> bool;        // optional: empty set returns None early
```

## Behavior

```mermaid
graph TD
    A["find_conf_in_dir(dir, name)"] --> B{"name.single()?"}
    B -->|Some| C["cur = absolute(dir)"]
    C --> D["cur.push(name)"]
    D --> E{try_exists?}
    E -->|Yes| H["Some(cur)"]
    E -->|No| F["cur.pop() 上跳一层"]
    F -->|成功| D
    F -->|已到根| K[None]
    B -->|None| G["cur = absolute(dir)"]
    G --> I["read_dir(cur)"]
    I --> J{"contains(entry name)?"}
    J -->|Yes| L["cur.push(entry), try_exists?"]
    L -->|hit| H
    L -->|broken link| I
    J -->|No| M["next entry"]
    M -->|entries done| F

Notes:

- Symbolic links are followed, matching `Path::try_exists` semantics
- Directories and files are both valid matches
- Nothing is opened or parsed, only existence and entry names are checked
- When several names hit the same directory, the winner follows directory
  entry order, not candidate order

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
