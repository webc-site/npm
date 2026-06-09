import ERR from "@3-/log/ERR.js";
import read from "@3-/read";
import write from "@3-/write";
import rule from "./rule.js";

export default async (files) => {
  for (const file of files) {
    if (file.endsWith(".js")) {
      try {
        const original = read(file);
        if (original) {
          const modified = await rule(original, file);
          if (modified) write(file, modified);
        }
      } catch (e) {
        ERR("Error processing " + file + ": " + e.message);
        process.exit(1);
      }
    }
  }
};
