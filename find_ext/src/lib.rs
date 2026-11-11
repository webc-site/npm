#![cfg_attr(docsrs, feature(doc_cfg))]

//! 遍历目录，按扩展名查找文件，并通过有界队列流式返回路径。
//!
//! ```
//! let finder = find_ext::FindExt::new(["rs", "toml"]);
//! for path in finder.find(".")? {
//!   println!("{}", path.display());
//! }
//! # Ok::<(), find_ext::Error>(())
//! ```

mod error;
mod find_ext;
mod receiver;

pub use error::{Error, Result};
pub use find_ext::{CHANNEL_SIZE, FindExt};
pub use ignore_dir::{DefaultIgnore, IGNORE_DIR, Ignore, is_hidden};
pub use receiver::{Iter, Receiver};
