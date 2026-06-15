import read from "@1-/read";
import { expect, test } from "bun:test";
import { join } from "node:path";
import { connect } from "@tidbcloud/serverless";
import { unlink } from "node:fs/promises";
import tidb from "../../conf/TIDB.serverless.js";
import dump from "../src/dump.js";
import save from "../src/save.js";

const db = connect({ url: tidb("webc"), arrayMode: true });

test("导出表结构", async () => {
  const sql_path = join(import.meta.dirname, "test.sql"),
    rm = async () => {
      try {
        await unlink(sql_path);
      } catch {}
    };

  await rm();
  await dump(db, sql_path);
  expect(await read(sql_path)).toContain("CREATE TABLE `proxy`");
  await rm();
});

test("保存逻辑", async () => {
  const test_ip = 2130706433,
    rm = () => db.execute("DELETE FROM proxy WHERE ipv4 = ?", [test_ip]),
    check = async (item) => {
      await save(db, [[test_ip, item]]);
      const [[count]] = await db.execute("SELECT COUNT(1) FROM proxy WHERE ipv4 = ?", [test_ip]);
      expect(Number(count)).toBe(1);
    };

  await rm();
  for (const item of [
    [0, 80],
    [1, 8080],
  ]) {
    await check(item);
  }
  await rm();
});
