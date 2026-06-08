import { createOpencode, createOpencodeClient } from "@opencode-ai/sdk";
import { CREATE_SESSION } from "./ERR.js";
import prompt from "./prompt.js";

export default async (dir, title) => {
  const { server } = await createOpencode(),
    client = createOpencodeClient({
      baseUrl: server.url,
      directory: dir,
    }),
    session_result = await client.session.create({
      body: {
        directory: dir,
        title,
      },
    });

  if (session_result.error) {
    server.close();
    throw [CREATE_SESSION, session_result.error];
  }

  const session = session_result.data,
    event_stream = await client.event.subscribe(),
    runPrompt = prompt(server, client, session, event_stream),
    res = [runPrompt, client, session];
  res[Symbol.asyncDispose] = async () => {
    server.close();
  };
  return res;
};
