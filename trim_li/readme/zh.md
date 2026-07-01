# trim_li : 过滤空行、修剪行尾空白及高性能文本还原库

高效、零拷贝的 Rust 行处理函数与还原机制。使用 SIMD 扫描字节流，自动去除行尾空白并过滤尾部空行，提取非空行列表。并提供基于咆哮位图（`RoaringBitmap`）的高性能文本还原控制体 `Restore`。

## 使用演示

```rust
use trim_li::trim_li;

fn main() {
  let txt = "  hello world  \r\n  \n  rust language  \n\n  ";
  let (restore, li) = trim_li(txt);

  let li_strs: Vec<&str> = li.iter().map(|s| s.as_str()).collect();
  assert_eq!(li_strs, vec!["  hello world", "  rust language"]);

  // 还原文本，中间的空行被保留且去除尾部缩进，结尾被 trim
  let restored = restore.load(&li).unwrap();
  assert_eq!(restored.as_str(), "  hello world\n\n  rust language");
}
```

## 特性介绍

- **SIMD 加速**：依托 `memchr` 库，借助硬件指令加速检索换行符。
- **零拷贝提取**：提取的非空行列表直接借用原字符串切片（`hipstr::HipStr`），无额外内存拷贝。
- **零内存分配**：空字符串输入 (`""`) 会触发极速短路处理，确保零堆内存分配。
- **高效还原**：`Restore::load` 结合 `RoaringBitmap` 迭代器，将还原复杂度从 $O(\text{总行数})$ 降至 $O(\text{非空行数})$，且规避运行时越界检查。在还原过程中利用高度优化的 `Vec::resize` 进行向量化内存填充，实现极速文本拼接。
- **去除尾缩进**：还原后的文本去除了行尾的空白字符和结尾的空行，仅保留有价值的缩进和中间空行。
- **序列化支持**：`Restore` 支持通过 `From`/`Into` 与二进制字节流（`&[u8]`/`Vec<u8>`）互转，便于持久化和网络传输。

## 设计思路

`trim_li` 基于双指针和 `memchr2` 扫描字节流。在每行截取时，剥离右侧尾部空白字符。如果为非空行，将其存储为借用的 `HipStr` 并将该行索引记录于咆哮位图（`RoaringBitmap`）中。尾部的空行由于没有后续非空行被自然过滤。`Restore` 直接曝光其包含的 `bitmap` 字段（记录所有非空行的行索引），在还原（`load`）时结合传入的非空行列表进行极速文本拼接。

## 技术堆栈

- 核心语言：Rust
- 依赖库：`memchr`, `hipstr`, `roaring`

## 目录结构

```text
.
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    └── main.rs
```

## API 说明

### 类型别名 `Li`

```rust
pub type Li<'a> = Vec<hipstr::HipStr<'a>>;
```

### 函数 `trim_li`

```rust
pub fn trim_li(txt: &str) -> (Restore, Li<'_>)
```

基于传入的字符串切片进行分行、去除尾随空白与尾随空行，返回还原信息与非空行列表。

### 结构体 `Restore`

```rust
pub struct Restore {
  pub bitmap: roaring::RoaringBitmap,
}
```

#### 方法 `Restore::load`

```rust
pub fn load<S: AsRef<str>>(&self, lines: &[S]) -> Option<hipstr::HipStr<'static>>
```

根据还原信息以及外部传入的（可能经过修改的）非空行列表，拼接并还原出最终文本。如果传入的列表长度不匹配，返回 `None`。

## 历史背景

换行符（LF, `\n`）与回车符（CR, `\r`）的历史可追溯至机械打字机及电传打字机时代。

打字机工作时，回车（Carriage Return）操作用于将纸架物理复位回左边界，而换行（Line Feed）操作则用于转动滚筒将纸张向上推移一行。早期计算机继承了这组控制字符。

微软 DOS 及 Windows 操作系统采用 `CRLF` 组合以兼容电传打字机规范。Unix 系统为节省内存，精简并统一采用单字节 `LF`。早期苹果 Macintosh 系统则使用单字节 `CR`。现代文本处理组件必须高度兼容上述多种换行符，同时在解析性能上做到极致。