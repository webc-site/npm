use crate::Result;
use cersei::events::AgentEvent;
use napi_derive::napi;
use std::sync::{Arc, OnceLock};
use tokio::runtime::Runtime;
use tokio::sync::mpsc::{Receiver, Sender};

pub const MSG_TXT: u32 = 1;
pub const MSG_TOOL: u32 = 2;
pub const MSG_END: u32 = 3;
pub const MSG_ERR: u32 = 4;

#[napi]
pub struct AgentStream {
  rx: Receiver<(u32, String)>,
}

#[napi]
impl AgentStream {
  pub(crate) fn new(rx: Receiver<(u32, String)>) -> Self {
    Self { rx }
  }

  #[napi]
  pub async unsafe fn next(&mut self) -> napi::Result<Option<(u32, String)>> {
    match self.rx.recv().await {
      Some(evt) => {
        if evt.0 == MSG_ERR {
          Err(napi::Error::from_reason(evt.1))
        } else {
          Ok(Some(evt))
        }
      }
      None => Ok(None),
    }
  }
}

pub(crate) fn get_runtime() -> &'static Runtime {
  static RUNTIME: OnceLock<Runtime> = OnceLock::new();
  RUNTIME.get_or_init(|| {
    tokio::runtime::Builder::new_multi_thread()
      .enable_all()
      .build()
      .expect("Failed to create tokio runtime")
  })
}

async fn run_inner(
  prompt: String,
  base_url: String,
  api_key: String,
  model: String,
  working_dir: String,
  tx: Sender<(u32, String)>,
) -> Result<()> {
  std::env::set_current_dir(&working_dir)?;
  let agent = Arc::new(crate::agent::build_agent(
    base_url,
    api_key,
    model,
    working_dir,
    None,
  )?);
  let mut stream = agent.run_stream(&prompt);

  while let Some(event) = stream.next().await {
    let callback_event = match event {
      AgentEvent::TextDelta(t) => Some((MSG_TXT, t)),
      AgentEvent::ToolStart { name, .. } => Some((MSG_TOOL, name)),
      AgentEvent::Complete(_) => Some((MSG_END, String::new())),
      _ => None,
    };

    if let Some(evt) = callback_event {
      let is_complete = evt.0 == MSG_END;
      if tx.send(evt).await.is_err() {
        break;
      }
      if is_complete {
        break;
      }
    }
  }

  Ok(())
}

#[napi]
pub fn run(
  prompt: String,
  base_url: String,
  api_key: String,
  model: String,
  working_dir: String,
) -> napi::Result<AgentStream> {
  let (tx, rx) = tokio::sync::mpsc::channel(100);

  let rt = get_runtime();
  rt.spawn(async move {
    let tx_clone = tx.clone();
    if let Err(e) = run_inner(prompt, base_url, api_key, model, working_dir, tx_clone).await {
      let _ = tx.send((MSG_ERR, e.to_string())).await;
    }
  });

  Ok(AgentStream::new(rx))
}
