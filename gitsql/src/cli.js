#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { join, resolve, relative } from "node:path";
import DB_PATH from "./const/DB_PATH.js";
import cliDump from "./cli/dump.js";
import cliLoad from "./cli/load.js";

/*
命令行入口
解析参数并执行 dump / load 命令
*/

const DUMP = "dump",
  main = async () => {
    const argv = await yargs(hideBin(process.argv))
        .command("dump <db_path>", "sqlite → sql + csv", (yargs) => {
          yargs.positional("db_path", {
            describe: "SQLite 数据库路径",
            type: "string"
          });
        })
        .command("load <db_path>", "sql + csv → sqlite", (yargs) => {
          yargs.positional("db_path", {
            describe: "SQLite 数据库路径",
            type: "string"
          });
        })
        .demandCommand(1)
        .strict()
        .help()
        .alias("h", "help").argv,
      {
        _: [cmd],
        db_path
      } = argv,
      base_dir = process.cwd(),
      db_list = [relative(base_dir, resolve(db_path))],
      base = join(base_dir, DB_PATH),
      md5_sqlite = join(base, "md5.sqlite");

    await (cmd === DUMP ? cliDump : cliLoad)(
      base_dir,
      base,
      db_list,
      md5_sqlite,
      md5_sqlite + "." + DUMP
    );
  };

export default main;

if (import.meta.main) await main();
