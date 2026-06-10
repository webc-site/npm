use crate::Result;
use cersei::prelude::OpenAi;
use cersei::prelude::{Agent, AllowAll};
use cersei::tools::coding;

pub fn build_agent(
  base_url: String,
  api_key: String,
  model: String,
  working_dir: String,
  initial_messages: Option<Vec<cersei::prelude::Message>>,
) -> Result<Agent> {
  let mut base_url = base_url;
  if base_url.ends_with('/') {
    base_url.pop();
  }

  let provider = OpenAi::builder()
    .base_url(base_url)
    .api_key(api_key)
    .build()?;

  let mut builder = Agent::builder()
    .provider(provider)
    .tools(coding())
    .permission_policy(AllowAll)
    .model(model)
    .working_dir(working_dir);

  if let Some(msgs) = initial_messages {
    builder = builder.with_messages(msgs);
  }

  let agent = builder.build()?;
  Ok(agent)
}
