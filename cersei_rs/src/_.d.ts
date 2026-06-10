export type AgentEvent = [number, string, string | null];

export declare const session: (
  base_url: string,
  api_key: string,
  model: string,
  working_dir: string,
  history?: { role: string; content: string }[] | null,
) => (prompt: string) => AsyncGenerator<AgentEvent, void, unknown>;

declare const chat: (
  base_url: string,
  api_key: string,
  model: string,
) => (prompt: string, working_dir: string) => AsyncGenerator<AgentEvent, void, unknown>;

export default chat;
