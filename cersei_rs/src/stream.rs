use std::mem::take;

use cersei::{
  events::{AgentEvent, AgentStream as CerseiAgentStream},
  prelude::serde_json,
};
use napi_derive::napi;
use tokio::sync::mpsc::{Receiver, Sender};

use crate::{Result, msg};

#[napi]
pub struct AgentStream {
  rx: Receiver<msg::Msg>,
}

#[napi]
impl AgentStream {
  pub(crate) fn new(rx: Receiver<msg::Msg>) -> Self {
    Self { rx }
  }

  /// 获取下一个流式事件，并对数据格式进行清洗规约。
  /// - 剔除数据末尾的多余换行符。
  /// - 过滤掉除 ERR 外的纯空事件，确保下游不会渲染空白行。
  #[napi]
  pub async unsafe fn next(&mut self) -> napi::Result<Option<(u8, String, Option<String>)>> {
    loop {
      match self.rx.recv().await {
        Some(evt) => match evt {
          msg::Msg::Txt(mut data) => {
            let len = data.trim_end_matches(['\r', '\n']).len();
            data.truncate(len);
            if data.is_empty() {
              continue;
            }
            return Ok(Some((msg::TXT, data, None)));
          }
          msg::Msg::Think(mut data) => {
            let len = data.trim_end_matches(['\r', '\n']).len();
            data.truncate(len);
            if data.is_empty() {
              continue;
            }
            return Ok(Some((msg::THINK, data, None)));
          }
          msg::Msg::Tool(name, args) => {
            return Ok(Some((msg::TOOL, name, args)));
          }
          msg::Msg::Err(err) => {
            return Err(napi::Error::from_reason(err));
          }
        },
        None => return Ok(None),
      }
    }
  }
}

#[inline]
fn is_newline(b: u8) -> bool {
  b == b'\n' || b == b'\r'
}

#[inline]
fn is_space_or_tab(b: u8) -> bool {
  b == b' ' || b == b'\t'
}

#[inline]
fn is_whitespace(b: u8) -> bool {
  is_space_or_tab(b) || is_newline(b)
}

#[inline]
fn new_ws_buffer() -> String {
  String::with_capacity(16)
}

fn trim_len(s: &str) -> usize {
  let bytes = s.as_bytes();
  bytes
    .iter()
    .rposition(|&b| !is_whitespace(b))
    .map_or(0, |pos| pos + 1)
}

/// 处理文本碎片的增量（Delta）输出。
/// 采用缓冲机制将尾部的换行符暂存，等到后续有实际内容时再输出，
/// 从而保证段落连续性，并允许在工具调用或结束时彻底丢弃尾部的空白行。
fn delta(mut t: String, buf: &mut String) -> Option<String> {
  let len = trim_len(&t);
  // 若当前碎片不含尾部空白，且之前有积攒的换行符，则将其插回头部一并输出
  if len == t.len() {
    if !buf.is_empty() {
      t.insert_str(0, buf);
      buf.clear();
    }
    return Some(t);
  }

  let has_spaces = t.as_bytes()[len..].iter().any(|&b| is_space_or_tab(b));
  if len == 0 && !has_spaces {
    buf.push_str(&t);
    return None;
  }

  let old_buf = take(buf);
  let bytes = unsafe { t.as_mut_vec() };
  let mut w = len;
  let len_bytes = bytes.len();
  for r in len..len_bytes {
    let b = unsafe { *bytes.get_unchecked(r) };
    if is_newline(b) {
      buf.push(b as char);
    } else if is_space_or_tab(b) {
      unsafe {
        *bytes.get_unchecked_mut(w) = b;
      }
      w += 1;
    }
  }
  bytes.truncate(w);

  if !old_buf.is_empty() {
    t.insert_str(0, &old_buf);
  }

  Some(t)
}

pub(crate) async fn run(mut stream: CerseiAgentStream, tx: Sender<msg::Msg>) -> Result<()> {
  let mut ws_buffer = new_ws_buffer();
  while let Some(event) = stream.next().await {
    match event {
      AgentEvent::TextDelta(t) => {
        if let Some(out) = delta(t, &mut ws_buffer)
          && tx.send(msg::Msg::Txt(out)).await.is_err()
        {
          break;
        }
      }
      AgentEvent::ThinkingDelta(t) => {
        if let Some(out) = delta(t, &mut ws_buffer)
          && tx.send(msg::Msg::Think(out)).await.is_err()
        {
          break;
        }
      }
      AgentEvent::ToolStart { name, input, .. } => {
        ws_buffer.clear();
        let args = serde_json::to_string(&input).ok();
        if tx.send(msg::Msg::Tool(name, args)).await.is_err() {
          break;
        }
      }
      AgentEvent::Complete(_) => {
        ws_buffer.clear();
        break;
      }
      _ => {}
    }
  }
  Ok(())
}
