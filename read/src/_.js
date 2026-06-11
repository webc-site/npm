import { readFile as r } from "fs/promises";

export default (path) => r(path, "utf8");
