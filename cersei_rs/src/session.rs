use std::{env, sync::Arc};

use cersei::prelude::{Message, MessageContent, Role};
use napi_derive::napi;
use tokio::sync::mpsc::{Sender, channel};

use crate::{
  Result,
  agent::build_agent,
  msg,
  rt::get_runtime,
  stream::{self, AgentStream},
};

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
            "user" => Role::User,
            "assistant" => Role::Assistant,
            "system" => Role::System,
            _ => Role::User,
          };
          Message {
            role,
            content: MessageContent::Text(msg.content),
            id: None,
            metadata: None,
          }
        })
        .collect::<Vec<_>>()
    });

    let agent = Arc::new(build_agent(
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
    let (tx, rx) = channel(100);
    let agent = Arc::clone(&self.agent);
    let working_dir = self.working_dir.clone();

    let rt = get_runtime();
    rt.spawn(async move {
      let tx_clone = tx.clone();
      if let Err(e) = chat_inner(agent, prompt, working_dir, tx_clone).await {
        let _ = tx.send((msg::ERR, e.to_string())).await;
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
  env::set_current_dir(&working_dir)?;
  let stream = agent.run_stream(&prompt);
  stream::run(stream, tx).await
}
