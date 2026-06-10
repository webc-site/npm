import { env } from "node:process";
import { createOpencodeServer } from "@opencode-ai/sdk";
import ping from "@3-/tcpping/ping.js";

export default async () => {
  const env = env,
    port = env.OPENCODE_PORT || 4096,
    host = env.OPENCODE_HOST || "127.0.0.1",
    url = "http://" + host + ":" + port;

  if (await ping(host, port, 999)) {
    return url;
  }
  try {
    await createOpencodeServer({ port, hostname: host });
  } catch {}
  return url;
};
