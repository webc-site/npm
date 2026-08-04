export type AgentEvent = [number, string, string | null];

export default function (
  base_url: string,
  api_key: string,
  model: string,
  working_dir: string,
  history?: { role: string; content: string }[] | null
): (prompt: string) => AsyncGenerator<AgentEvent, void, unknown>;
