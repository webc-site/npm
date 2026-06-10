use crate::Result;
use crate::chat::{
  get_runtime, AgentStream, MSG_END, MSG_ERR, MSG_TXT, MSG_TOOL,
};
use cersei::events::AgentEvent;
use napi_derive::napi;
use std::sync::Arc;
use tokio::sync::mpsc::Sender;

#[napi(object)]
pub struct ChatMessage {
  pub role: String,
  pub content: String,
}

#[napi]
pub struct AgentSession {
  agent: Arc<cersei::Agent>,
  working_dir: String,
}

#[napi]
impl AgentSession {
  #[napi(constructor)]
  pub fn new(
    base_url: String,
    api_key: String,
    model: String,
    working_dir: String,
    history: Option<Vec<ChatMessage>>,
  ) -> napi::Result<Self> {
    let initial_messages = history.map(|msgs| {
      msgs
        .into_iter()
        .map(|msg| {
          let role = match msg.role.as_str() {
            "user" => cersei::prelude::Role::User,
            "assistant" => cersei::prelude::Role::Assistant,
            "system" => cersei::prelude::Role::System,
            _ => match msg.role.to_lowercase().as_str() {
              "user" => cersei::prelude::Role::User,
              "assistant" => cersei::prelude::Role::Assistant,
              "system" => cersei::prelude::Role::System,
              _ => cersei::prelude::Role::User,
            },
          };
          cersei::prelude::Message {
            role,
            content: cersei::prelude::MessageContent::Text(msg.content),
            id: None,
            metadata: None,
          }
        })
        .collect::<Vec<_>>()
    });

    let agent = Arc::new(crate::agent::build_agent(
      base_url,
      api_key,
      model,
      working_dir.clone(),
      initial_messages,
    )?);
    Ok(Self { agent, working_dir })
  }

  #[napi]
  pub fn chat(&self, prompt: String) -> napi::Result<AgentStream> {
    let (tx, rx) = tokio::sync::mpsc::channel(100);
    let agent = Arc::clone(&self.agent);
    let working_dir = self.working_dir.clone();

    let rt = get_runtime();
    rt.spawn(async move {
      let tx_clone = tx.clone();
      if let Err(e) = chat_inner(agent, prompt, working_dir, tx_clone).await {
        let _ = tx.send((MSG_ERR, e.to_string())).await;
      }
    });

    Ok(AgentStream::new(rx))
  }
}

async fn chat_inner(
  agent: Arc<cersei::Agent>,
  prompt: String,
  working_dir: String,
  tx: Sender<(u32, String)>,
) -> Result<()> {
  std::env::set_current_dir(&working_dir)?;
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
