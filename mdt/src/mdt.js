#!/usr/bin/env bun
import { writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import walk from "@1-/walk/walkRelIgnore.js";
import { FILE } from "@1-/walk";
import render from "./_.js";

const [target] = yargs(hideBin(process.argv))
    .usage("Usage: $0 [path]")
    .help("h")
    .alias("h", "help")
    .parseSync()._,
  /*
渲染并写入对应 md 文件
mdt_path: mdt 文件绝对路径
*/
  save = async (mdt_path) => {
    await writeFile(mdt_path.slice(0, -1), await render(mdt_path));
  },
  /*
遍历目录渲染所有 .mdt 文件
dir: 目录绝对路径
*/
  scan = async (dir) => {
    await walk(
      dir,
      async (kind, rel) => {
        if (kind === FILE && rel.endsWith(".mdt")) {
          console.log(rel);
          await save(resolve(dir, rel));
        }
      },
      1
    );
  };

if (target) {
  const target_path = resolve(process.cwd(), target),
    info = await stat(target_path);
  if (info.isDirectory()) {
    await scan(target_path);
  } else if (target_path.endsWith(".mdt")) {
    console.log(target);
    await save(target_path);
  }
} else {
  await scan(process.cwd());
}
