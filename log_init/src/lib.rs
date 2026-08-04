#![cfg_attr(docsrs, feature(doc_cfg))]

mod kv;
pub mod layout;

#[cfg(all(target_os = "linux", feature = "systemd"))]
use std::env;

use jiff::tz::TimeZone;
pub use kv::Kv;
pub use layout::{Text, level_color};
use logforth::{append, filter::rustlog::RustLogFilterBuilder, starter_log};

#[static_init::dynamic]
pub static TZ: TimeZone = TimeZone::system();

use std::sync::Once;

static INIT: Once = Once::new();

fn init_with_appender<A>(appender: A)
where
  A: append::Append + 'static,
{
  starter_log::builder()
    .dispatch(|d| {
      d.filter(RustLogFilterBuilder::from_default_env().build())
        .append(appender)
    })
    .apply();
}

pub fn init() {
  INIT.call_once(|| {
    // Check if we're in a systemd environment (Linux systems with INVOCATION_ID)
    // 检查是否在 systemd 环境中 (带 INVOCATION_ID 的 Linux 系统)
    #[cfg(all(target_os = "linux", feature = "systemd"))]
    if env::var("INVOCATION_ID").is_ok() {
      // journald is inherently unbuffered (uses UnixDatagram which doesn't buffer)
      // journald 本质上是无缓冲的 (使用不缓冲的 UnixDatagram)
      if let Ok(journald) = logforth_append_journald::Journald::new() {
        init_with_appender(journald);
        return;
      }
    }
    // If journald fails, fall back to stdout
    // 如果 journald 失败，回退到 stdout

    // Fallback to stdout logging
    // 回退到 stdout 日志
    #[cfg(feature = "stdout")]
    {
      let stdout = append::Stdout::default().with_layout(layout::Text::default());
      init_with_appender(stdout);
    }
    #[cfg(not(feature = "stdout"))]
    {
      panic!("No logging backend available")
    }
  });
}
