import GREEN from "@3-/log/GREEN.js";
import { SEND_PROMPT } from "./ERR.js";
import stream from "./stream.js";

export default async (client, session, event_stream, prompt) => {
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
    throw [SEND_PROMPT, prompt_result.error];
  }

  await idle_promise;
  return reply_text;
};
