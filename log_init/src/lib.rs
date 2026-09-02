#![cfg_attr(docsrs, feature(doc_cfg))]

#[cfg(all(target_os = "linux", feature = "systemd"))]
use std::env;
use std::sync::{LazyLock, Once};

use jiff::tz::TimeZone;
use logforth::{append, filter::rustlog::RustLogFilterBuilder, starter_log};

mod kv;
mod layout;

pub use kv::Kv;
pub use layout::{Text, level_color};

pub static TZ: LazyLock<TimeZone> = LazyLock::new(TimeZone::system);

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
    #[cfg(all(target_os = "linux", feature = "systemd"))]
    if env::var_os("INVOCATION_ID").is_some() {
      if let Ok(journald) = logforth_append_journald::Journald::new() {
        init_with_appender(journald);
        return;
      }
    }

    #[cfg(feature = "stdout")]
    {
      let stdout = append::Stdout::default().with_layout(Text::default());
      init_with_appender(stdout);
    }
  });
}
