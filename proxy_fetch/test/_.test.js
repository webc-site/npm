import read from "@1-/read";
import { expect, test } from "bun:test";
import { join } from "node:path";
import { SQL } from "bun";
import { unlink } from "node:fs/promises";
import tidb from "../../conf/TIDB.js";
import dump from "../src/dump.js";
import save from "../src/save.js";

const DB = new SQL(tidb("webc"));

test("导出表结构", async () => {
  const sql_path = join(import.meta.dirname, "test.sql");
  try {
    await dump(DB, sql_path);
    expect(await read(sql_path)).toContain("CREATE TABLE `proxy`");
  } finally {
    try {
      await unlink(sql_path);
    } catch {}
  }
}, 20000);

test("保存逻辑", async () => {
  const test_ip = 2130706433,
    rm = () => DB.unsafe("DELETE FROM proxy WHERE ipv4 = ?", [test_ip]);
  try {
    await rm();
    const check = async (item) => {
      await save(DB, [[test_ip, item]]);
      const [{ count }] = await DB.unsafe("SELECT COUNT(1) AS count FROM proxy WHERE ipv4 = ?", [
        test_ip,
      ]);
      expect(Number(count)).toBe(1);
    };

    for (const item of [
      [0, 80],
      [1, 8080],
    ]) {
      await check(item);
    }
  } finally {
    await rm();
  }
}, 20000);
