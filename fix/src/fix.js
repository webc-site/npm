#!/usr/bin/env bun

import { resolve } from "node:path";
import yargs from "yargs";
import walkRelIgnore from "@1-/walk/walkRelIgnore.js";
import { FILE } from "@1-/walk";
import run from "./run.js";

if (import.meta.main) {
  /*
  解析命令行参数
  若指定了文件，则对指定文件进行处理
  否则递归扫描当前目录下的 js 文件
  */
  const { _ } = yargs(process.argv.slice(2)).parse();
  if (_.length) {
    await run(_.map((file) => resolve(file)));
  } else {
    const file_list = [];
    await walkRelIgnore(process.cwd(), (kind, rel) => {
      if (kind === FILE && rel.endsWith(".js")) {
        file_list.push(resolve(rel));
      }
    });
    if (file_list.length) {
      await run(file_list);
    }
  }
}
