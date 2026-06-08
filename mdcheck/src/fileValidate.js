import { readFile } from "node:fs/promises";
import mdValidate from "./mdValidate.js";

export default async (path) => mdValidate(await readFile(path, "utf8"));
