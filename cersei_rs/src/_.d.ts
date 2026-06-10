export const MSG_TXT = 1;
export const MSG_TOOL = 2;
export const MSG_END = 3;
export const MSG_ERR = 4;

export type AgentEvent = [number, string];

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
