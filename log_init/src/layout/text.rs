use std::{
  cell::Cell,
  fmt::Write,
  io::{IsTerminal, stdout},
};

use colored::{ColoredString, Colorize};
use logforth::{
  Error as LogforthError, Layout,
  diagnostic::Diagnostic,
  record::{Level, Record},
};

use crate::kv::KvRef;

thread_local! {
  static LAST_TIME: Cell<(u64, [u8; 19])> = const { Cell::new((0, [0u8; 19])) };
}

#[derive(Debug)]
pub struct Text {
  pub color: bool,
}

pub fn level_color(level: Level) -> ColoredString {
  let name = level.name();
  match level {
    Level::Error
    | Level::Error2
    | Level::Error3
    | Level::Error4
    | Level::Fatal
    | Level::Fatal2
    | Level::Fatal3
    | Level::Fatal4 => name.red(),
    Level::Warn | Level::Warn2 | Level::Warn3 | Level::Warn4 => name.yellow(),
    Level::Info | Level::Info2 | Level::Info3 | Level::Info4 => name.green(),
    Level::Debug | Level::Debug2 | Level::Debug3 | Level::Debug4 => name.blue(),
    Level::Trace | Level::Trace2 | Level::Trace3 | Level::Trace4 => name.magenta(),
  }
}

impl Default for Text {
  fn default() -> Self {
    Self {
      color: stdout().is_terminal(),
    }
  }
}

struct ArrayWriter {
  buf: [u8; 19],
  pos: usize,
}

impl Write for ArrayWriter {
  fn write_str(&mut self, s: &str) -> std::fmt::Result {
    let bytes = s.as_bytes();
    if self.pos + bytes.len() <= 19 {
      self.buf[self.pos..self.pos + bytes.len()].copy_from_slice(bytes);
      self.pos += bytes.len();
      Ok(())
    } else {
      Err(std::fmt::Error)
    }
  }
}

fn write_timestamp(buf: &mut String, ts: u64) {
  LAST_TIME.with(|cell| {
    let (cached_ts, cached_bytes) = cell.get();
    if cached_ts == ts
      && cached_ts != 0
      && let Ok(s) = std::str::from_utf8(&cached_bytes)
    {
      buf.push_str(s);
      return;
    }

    if let Ok(ts_i64) = i64::try_from(ts)
      && let Ok(timestamp) = jiff::Timestamp::from_second(ts_i64)
    {
      let zoned = jiff::Zoned::new(timestamp, crate::TZ.clone());
      let mut writer = ArrayWriter {
        buf: [0u8; 19],
        pos: 0,
      };
      if write!(writer, "{}", zoned.strftime("%Y-%m-%d %H:%M:%S")).is_ok()
        && writer.pos == 19
        && let Ok(s) = std::str::from_utf8(&writer.buf)
      {
        cell.set((ts, writer.buf));
        buf.push_str(s);
        return;
      }
    }

    let _ = write!(buf, "{ts}");
  });
}

impl Layout for Text {
  fn format(
    &self,
    record: &Record<'_>,
    diagnostics: &[Box<dyn Diagnostic>],
  ) -> Result<Vec<u8>, LogforthError> {
    let mut buf = String::with_capacity(128);
    let level = record.level();
    let file = record.file().unwrap_or_else(|| record.target());

    if self.color {
      let level_str = level_color(level);
      if let Some(line) = record.line() {
        let _ = write!(
          buf,
          "{level_str} \x1b[90m{file}:{line}\x1b[0m {}",
          record.payload()
        );
      } else {
        let _ = write!(
          buf,
          "{level_str} \x1b[90m{file}\x1b[0m {}",
          record.payload()
        );
      }
    } else {
      let ts = coarsetime::Clock::now_since_epoch().as_secs();
      let _ = write!(buf, "{level} ");
      write_timestamp(&mut buf, ts);
      if let Some(line) = record.line() {
        let _ = write!(buf, " {file}:{line} {}", record.payload());
      } else {
        let _ = write!(buf, " {file} {}", record.payload());
      }
    }

    record.key_values().visit(&mut KvRef(&mut buf))?;
    for d in diagnostics {
      d.visit(&mut KvRef(&mut buf))?;
    }

    Ok(buf.into_bytes())
  }
}
