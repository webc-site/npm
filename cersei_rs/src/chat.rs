use std::{env, sync::Arc};

use napi_derive::napi;
use tokio::sync::mpsc::{Sender, channel};

use crate::{
  Result,
  agent::build_agent,
  msg,
  rt::get_runtime,
  stream::{self, AgentStream},
};

async fn run_inner(
  prompt: String,
  base_url: String,
  api_key: String,
  model: String,
  working_dir: String,
  tx: Sender<(u32, String)>,
) -> Result<()> {
  env::set_current_dir(&working_dir)?;
  let agent = Arc::new(build_agent(base_url, api_key, model, working_dir, None)?);
  let stream = agent.run_stream(&prompt);
  stream::run(stream, tx).await
}

#[napi]
pub fn run(
  prompt: String,
  base_url: String,
  api_key: String,
  model: String,
  working_dir: String,
) -> napi::Result<AgentStream> {
  let (tx, rx) = channel(100);

  let rt = get_runtime();
  rt.spawn(async move {
    let tx_clone = tx.clone();
    if let Err(e) = run_inner(prompt, base_url, api_key, model, working_dir, tx_clone).await {
      let _ = tx.send((msg::ERR, e.to_string())).await;
    }
  });

  Ok(AgentStream::new(rx))
}
