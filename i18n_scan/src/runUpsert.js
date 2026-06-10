import { sep } from "node:path";

export default async (fn, prefix, rel, from, to_lang, to_path, upsert, log) => {
  try {
    await fn(prefix, rel, from, to_lang, log);
    await upsert(to_path);
  } catch (err) {
    log("❌ " + prefix + sep + to_lang + sep + rel + ": " + err.message);
  }
};
