#![cfg_attr(docsrs, feature(doc_cfg))]

//! 遍历目录，按扩展名查找文件，并通过有界队列流式返回路径。
//!
//! ```
//! let finder = find_ext::FindExt::new(["rs", "toml"]);
//! let rx = finder.find(".")?;
//! while let Ok(path) = rx.recv() {
//!   println!("{}", path.display());
//! }
//! # Ok::<(), find_ext::Error>(())
//! ```

mod error;
mod find_ext;
mod ignore;

pub use error::{Error, Result};
pub use find_ext::{CHANNEL_SIZE, FindExt, Receiver};
pub use ignore::{DefaultIgnore, IGNORE_DIR, Ignore};
