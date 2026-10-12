#!/usr/bin/env bun

import TIDB from "../../conf/TIDB.js";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const url = new URL(TIDB("webc")),
  env_dir = join(import.meta.dirname, "env"),
  write = async (path, content) => {
    await writeFile(path, content);
    console.log(path + "\n" + content);
  };

await mkdir(env_dir, { recursive: true });

const env_content =
  Object.entries({
    DB_HOST: url.hostname,
    DB_PORT: url.port || "3306",
    DB_USER: decodeURIComponent(url.username),
    DB_PASSWORD: decodeURIComponent(url.password),
    DB_NAME: url.pathname.slice(1)
  })
    .map(([k, v]) => k + "='" + v + "'")
    .join("\n") + "\n";

await write(join(env_dir, "db.env"), env_content);
