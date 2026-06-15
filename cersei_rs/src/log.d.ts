import { MSG_ERR, MSG_TOOL, MSG_TXT, MSG_THINK } from "./MSG.js";

export const MSG: Record<number, string>;

export type AgentEvent = [number, string, string | null];

declare const out: (stream: AsyncGenerator<AgentEvent, void, unknown> | any) => Promise<string>;
export default out;
