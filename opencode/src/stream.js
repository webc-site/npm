import { stdout } from "node:process";
import GRAY from "@3-/log/GRAY.js";
import GREEN from "@3-/log/GREEN.js";

export default async (client, session, event_stream, onTextDelta) => {
  let last_type = "";
  for await (const event of event_stream.stream) {
    const { type, properties } = event;
    if (properties?.sessionID !== session.id) {
      continue;
    }
    if (type === "session.idle") {
      stdout.write("\n");
      return;
    }
    if (type === "permission.updated") {
      await client.postSessionIdPermissionsPermissionId({
        path: {
          id: session.id,
          permissionID: properties.id,
        },
        body: {
          response: "always",
        },
      });
    }
    if (type === "message.part.updated") {
      const part = properties?.part;
      if (part && properties.delta) {
        if (part.type !== last_type) {
          if (part.type === "reasoning") {
            stdout.write("\n");
            GRAY("[思考]");
          } else if (part.type === "text") {
            stdout.write("\n");
            GREEN("[回复]");
          }
          last_type = part.type;
        }
        stdout.write(properties.delta);
        if (part.type === "text" && onTextDelta) {
          onTextDelta(properties.delta);
        }
      }
    }
  }
};
