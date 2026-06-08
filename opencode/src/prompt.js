import GREEN from "@3-/log/GREEN.js";
import { SEND_PROMPT } from "./ERR.js";
import stream from "./stream.js";

const once = async (server, client, session, event_stream, prompt) => {
  GREEN("\n提示词:");
  console.log(prompt);

  let reply_text = "";
  const idle_promise = stream(client, session, event_stream, (delta) => {
      reply_text += delta;
    }),
    prompt_result = await client.session.prompt({
      path: { id: session.id },
      body: {
        parts: [{ type: "text", text: prompt }],
      },
    });

  if (prompt_result.error) {
    server.close();
    throw [SEND_PROMPT, prompt_result.error];
  }

  await idle_promise;
  return reply_text;
};

export default (server, client, session, event_stream) => {
  const run = async (prompt) => [await once(server, client, session, event_stream, prompt), run];
  return run;
};
