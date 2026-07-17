# strjoin : 针对 Rust 迭代器的高性能零临时分配字符串拼接扩展

针对 Rust 迭代器的高性能字符串拼接扩展。无需通过 `collect::<Vec<_>>()` 进行临时内存分配即可实现高效拼接。

## 项目功能介绍

本库提供 `Join` 扩展特征。允许在任何迭代器上直接调用 `join` 方法，彻底免除拼接过程中产生的临时容器堆内存分配。

## 使用演示

```rust
use strjoin::Join;

let items = ["hello", "world"];
let joined = items.into_iter().join("\n");
assert_eq!(joined, "hello\nworld");

// 适用于 map 后的迭代器，无需额外 collect 转换为 Vec
let nums = [1, 2, 3];
let joined_nums = nums.iter().map(|n| n.to_string()).join(", ");
assert_eq!(joined_nums, "1, 2, 3");
```

## 特性介绍

- **零临时分配**：避免使用 `collect::<Vec<_>>()` 产生的堆内存申请与数据拷贝
- **限额同质预估**：利用迭代器 `size_hint` 及首元素长度计算初始容量，设置上限防范内存异常暴涨，实现单次内存分配
- **内迭代优化**：采用 `for_each` 机制，触发编译器循环展开与分支优化
- **零成本抽象**：使用泛型与 `AsRef<str>` 约束，在编译期完成单态化，保障运行速度

## 设计思路

```mermaid
graph TD
  A[迭代器] --> B{获取首元素}
  B -->|无元素| C[返回空 String]
  B -->|有元素| D[获取 size_hint.0 下限]
  D --> E[限额计算预估容量]
  E --> F[String::with_capacity 分配内存]
  F --> G[写入首元素]
  G --> H[使用 for_each 遍历后续元素]
  H --> I[循环写入分隔符与元素]
  I --> J[返回拼接后的 String]
```

## 技术堆栈

- Rust 2024 edition

## 目录结构

```text
.
├── Cargo.toml
├── README.md
├── README.mdt
├── readme
│   ├── en.md
│   └── zh.md
├── src
│   └── lib.rs
├── test.sh
└── tests
    └── main.rs
```

## API 说明

### `Join`

针对所有 `Item` 类型满足 `AsRef<str>` 的 `Iterator` 实现的扩展特征。

#### `fn join(self, sep: impl AsRef<str>) -> String`

使用指定分隔符拼接迭代器元素。

- `self`：消费该迭代器。
- `sep`：分隔符，支持任何实现 `AsRef<str>` 的类型。
- 返回值：拼接完成后的新 `String`。

## 历史故事

在 Rust 1.3.0 之前，切片的拼接方法曾被称为 `connect`。为契合现代主流编程语言的习惯，官方随后将其重命名为 `join`。然而，Rust 标准库仅为切片 `[T]` 提供了高效的 `join` 接口，并未对通用迭代器开放。这促使开发者通常需要先编写 `.collect::<Vec<_>>().join(...)`，造成了冗余的临时内存分配。`strjoin` 填补了此空白，通过引入限额同质预估策略，使得在迭代器流上直接进行高性能拼接成为可能。
