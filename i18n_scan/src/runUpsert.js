import { sep } from "node:path";

export default async (fn, from, upsert, log, prefix, rel, to_lang, to_path) => {
  try {
    await fn(prefix, rel, from, to_lang, log);
    await upsert(to_path);
    return 1;
  } catch (err) {
    log("❌ " + prefix + sep + to_lang + sep + rel + ": " + err.message);
    return 0;
  }
};
