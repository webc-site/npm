# find_conf: 逐级向上查找配置文件

- [概述](#概述)
- [功能特性](#功能特性)
- [安装](#安装)
- [使用方法](#使用方法)
- [API 参考](#api-参考)
- [行为说明](#行为说明)
- [错误处理](#错误处理)

## 概述

`find_conf` 从指定目录开始，逐级向上查找配置文件或目录，直到文件系统根目录。
这与 `git`、`eslint`、`cargo` 查找项目配置的策略一致。

若一直找到 `/` 仍无匹配，返回 `None`，而非报错。

## 功能特性

- **向上查找**：依次检查起始目录及其所有父目录
- **两个入口**：进程当前目录，或任意指定目录
- **文件或目录**：适用于 `conf.toml`、`.git`、`.env` 等
- **最近优先**：最近一层命中的目录胜出
- **单名字每层一次 stat**：完全不读目录
- **集合每层只读一次目录**：逐条目用 `Name::contains` 比对
- **不 panic**：所有失败通过 `Result` 返回
- **多名字一次查找**：传切片、数组、`Vec` 或集合，可在每层目录匹配多个条目，
  例如 `.git` / `.hg` / `.svn`

## 安装

```sh
cargo add find_conf
```

## 使用方法

```rust
fn main() -> find_conf::Result<()> {
  // 从进程当前目录向上查找
  if let Some(path) = find_conf::find_conf("conf.toml")? {
    println!("found: {}", path.display());
  }

  // 从指定目录向上查找
  let found = find_conf::find_conf_in_dir("/srv/app/src", ".git")?;
  println!("{found:?}");
  Ok(())
}
```

典型目录结构：

```
/srv/app
├── conf.toml          <- 命中
└── src
    └── lib
        └── here       <- 起始目录
```

`find_conf_in_dir("/srv/app/src/lib/here", "conf.toml")` 返回
`Some("/srv/app/conf.toml")`。

传多个候选，可兼容不同版本控制系统的仓库根：

```rust
let root = find_conf::find_conf([".git", ".hg", ".svn"])?;
```

## API 参考

### `find_conf(name: impl Name) -> Result<Option<PathBuf>>`

从 `std::env::current_dir()` 开始向上查找至根目录。

### `find_conf_in_dir(dir: impl AsRef<Path>, name: impl Name) -> Result<Option<PathBuf>>`

从 `dir` 开始向上查找至根目录。

- `dir` 为相对路径时，用 `std::path::absolute` 转为绝对路径
- 单名字拼接到每层目录后 `try_exists`，支持 `sub/conf.toml` 与绝对路径
- 集合每层只 `read_dir` 一次，逐条目用 `Name::contains` 比对，名字须为条目名
- 最近一层命中即返回；`dir` 不存在则继续向上
- 相对输入返回的路径为绝对路径

两个函数均在首次命中时返回 `Ok(Some(path))`，所有祖先目录都不含任何候选名字
时返回 `Ok(None)`。IO 错误（含权限）返回 `Err`，不会跳过。

### `Name`：候选名字集合

`name` 既可以是单个名字，也可以是一组候选：

| 类型 | 查找方式 | 示例 |
| --- | --- | --- |
| 单个 | 逐层拼接 + `stat` | `"conf.toml"`、`"sub/conf.toml"` |
| 切片 / 数组 | 条目名，每层一次 `read_dir` | `[".git", ".hg", ".svn"]` |
| `Vec` | 条目名 | `vec![".i18n", "i18n"]` |
| `HashSet` / `BTreeSet` | 条目名 | `HashSet::from([".git", ".hg"])` |

自定义类型实现以下方法：

```rust
fn contains(&self, name: &Path) -> bool;
fn single(&self) -> Option<&Path>; // 可选：返回单名字以走 stat 快速路径
fn is_empty(&self) -> bool;        // 可选：空集合直接返回 None
```

## 行为说明

```mermaid
graph TD
    A["find_conf_in_dir(dir, name)"] --> B{"name.single() 有值?"}
    B -->|有| C["cur = absolute(dir)"]
    C --> D["cur.push(name)"]
    D --> E{try_exists?}
    E -->|是| H["Some(cur)"]
    E -->|否| F["cur.pop() 上跳一层"]
    F -->|成功| D
    F -->|已到根| K[None]
    B -->|无| G["cur = absolute(dir)"]
    G --> I["read_dir(cur)"]
    I --> J{"contains(条目名)?"}
    J -->|是| L["cur.push(条目名), try_exists?"]
    L -->|命中| H
    L -->|断链| I
    J -->|否| M["下一个条目"]
    M -->|条目遍历完| F

注意：

- 符号链接会被跟随，与 `Path::try_exists` 语义一致
- 文件与目录均可命中
- 只检查存在性，不打开、不解析内容
- 权限错误等 IO 失败会返回 `Err`，不会静默忽略

## 错误处理

```rust
pub enum Error {
  Io(std::io::Error),
}
```

唯一错误来源是 IO：获取进程目录失败，或检查候选路径失败。
"未找到" 永远不是错误。

```rust
match find_conf::find_conf("conf.toml") {
  Ok(Some(path)) => println!("{}", path.display()),
  Ok(None) => eprintln!("所有父目录中都没有 conf.toml"),
  Err(err) => eprintln!("io error: {err}"),
}
```
