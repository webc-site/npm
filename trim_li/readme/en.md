# trim_li : High-performance line-trimming, line-filtering, and text restoration library

High-performance, zero-copy line processing library in Rust. Scans byte streams using SIMD, trims trailing whitespaces, and filters trailing empty lines to extract non-empty lines, while providing a high-performance text restorer (`Restore`) based on roaring bitmap (`RoaringBitmap`).

## Usage

```rust
use trim_li::trim_li;

fn main() {
  let txt = "  hello world  \r\n  \n  rust language  \n\n  ";
  let (restore, li) = trim_li(txt);

  let li_strs: Vec<&str> = li.iter().map(|s| s.as_str()).collect();
  assert_eq!(li_strs, vec!["  hello world", "  rust language"]);

  // Restores the text, intermediate empty lines are kept without trailing spaces, trailing empty lines are trimmed
  let restored = restore.load(&li).unwrap();
  assert_eq!(restored.as_str(), "  hello world\n\n  rust language");
}
```

## Features

- **SIMD Acceleration**: Utilizes `memchr` for hardware-accelerated scanning of newline bytes.
- **Zero-Copy Extraction**: Extracted non-empty lines directly borrow substrings from the original string slice (`hipstr::HipStr`), avoiding extra allocations.
- **Zero Heap Allocation**: Immediately short-circuits empty string inputs (`""`) to guarantee zero heap allocation.
- **Efficient Restoration**: `Restore::load` combines a `RoaringBitmap` iterator to reduce the reconstruction complexity from $O(\text{total\_lines})$ to $O(\text{non\_empty\_count})$ while eliminating runtime bounds checks. It leverages highly-optimized `Vec::resize` based memory filling for ultra-fast text concatenation.
- **Smart Trailing Trim**: The restored text strips trailing spaces from all lines and discards trailing empty lines, keeping only meaningful indentation and intermediate empty lines.
- **Serialization**: `Restore` supports serialization to and deserialization from binary byte streams (`&[u8]` / `Vec<u8>`) via `From` / `Into` for easy transmission or persistence.

## Design

`trim_li` runs a scanning loop using dual pointers and `memchr2` over the byte slice of the input. In each line iteration, it trims trailing whitespaces. If the line is non-empty, it stores it as a borrowed `HipStr` and records its line index in a roaring bitmap (`RoaringBitmap`). Trailing empty lines are naturally discarded as they are not followed by any non-empty lines. `Restore` exposes the `bitmap` containing the indices of non-empty lines to efficiently splice them back into a unified text.

## Stack

- Core Language: Rust
- Dependencies: `memchr`, `hipstr`, `roaring`

## Directory Structure

```text
.
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    └── main.rs
```

## API

### Type Alias `Li`

```rust
pub type Li<'a> = Vec<hipstr::HipStr<'a>>;
```

### Function `trim_li`

```rust
pub fn trim_li(txt: &str) -> (Restore, Li<'_>)
```

Splits the input string into lines, trims trailing whitespaces and trailing empty lines, and returns the restoration handler alongside the list of non-empty lines.

### Struct `Restore`

```rust
pub struct Restore {
  pub bitmap: roaring::RoaringBitmap,
}
```

#### Method `Restore::load`

```rust
pub fn load<S: AsRef<str>>(&self, lines: &[S]) -> Option<hipstr::HipStr<'static>>
```

Reconstructs the original text by concatenating the provided (optionally modified) non-empty lines with the recorded empty lines. Returns `None` if the input slice length does not match the expected non-empty line count.

## History

The term "Line Feed" (LF, `\n`) and "Carriage Return" (CR, `\r`) originated from physical typewriters and early teleprinters.

In mechanical typewriters, a carriage return carriage assembly physically moved the paper carriage back to the left margin, while a line feed mechanism rotated the cylinder to advance the paper down by one line. Early computers inherited these control characters to represent newlines.

Microsoft DOS and Windows adopted the `CRLF` sequence, matching the teleprinter standard. Unix systems simplified newlines to a single `LF` to save memory, while early Apple Macintosh systems used a single `CR`. Modern text processing utilities must robustly normalize these distinct line endings while maintaining processing efficiency.
