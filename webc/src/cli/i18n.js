import i18nyml from "@1-/i18nyml";
import { join, basename } from "node:path";

const DIR = join(import.meta.dirname, "../i18n");

export default (meta) => i18nyml(DIR, basename(meta.filename, ".js"));
