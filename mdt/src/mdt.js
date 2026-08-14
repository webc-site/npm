#!/usr/bin/env bun
import { writeFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import walk from "@1-/walk/walkRelIgnore.js";
import { FILE } from "@1-/walk";
import render from "./_.js";

const argv = yargs(hideBin(process.argv))
    .usage("Usage: $0 [path]")
    .help("h")
    .alias("h", "help")
    .parseSync(),
  target = argv._[0],
  /*
渲染 mdt 文件并写入对应的 md 文件
mdt_path: mdt 文件绝对路径
*/
  save = async (mdt_path) => {
    await writeFile(mdt_path.slice(0, -1), await render(mdt_path, dirname(mdt_path)));
  },
  /*
遍历目录，渲染所有以 .mdt 结尾的文件
dir_path: 目录绝对路径
*/
  scan = async (dir_path) => {
    await walk(
      dir_path,
      async (kind, rel_path) => {
        if (kind === FILE && rel_path.endsWith(".mdt")) {
          console.log(rel_path);
          await save(resolve(dir_path, rel_path));
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
