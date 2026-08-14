import { env } from "node:process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import read from "@3-/read";
import { load } from "js-yaml";

let { WEBC_TOKEN: token, WEBC_API: api = "https://api.webc.site/" } = env;

if (!token) {
  const conf_path = join(homedir(), ".config/webc.site.yml");
  if (existsSync(conf_path)) {
    ({ token } = load(read(conf_path)) || {});
  }
}

export const API = api,
  TOKEN = token;
