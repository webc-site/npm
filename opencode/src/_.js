import { createOpencodeClient } from "@opencode-ai/sdk";
import { CREATE_SESSION } from "./ERR.js";
import once from "./prompt.js";
import srv from "./srv.js";

export default async (dir, title) => {
  const url = await srv(),
    client = createOpencodeClient({
      baseUrl: url,
      directory: dir,
    }),
    session_result = await client.session.create({
      body: {
        directory: dir,
        title,
      },
    });

  if (session_result.error) {
    throw [CREATE_SESSION, session_result.error];
  }

  const session = session_result.data,
    event_stream = await client.event.subscribe(),
    // 使用示例: const [reply, next_run] = await run("提示词")
    run = async (prompt) => [await once(client, session, event_stream, prompt), run];

  return [run, client, session];
};
