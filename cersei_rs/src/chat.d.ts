export type AgentEvent = [number, string, string | null];

export default function (
  base_url: string,
  api_key: string,
  model: string,
): (prompt: string, working_dir: string) => AsyncGenerator<AgentEvent, void, unknown>;
