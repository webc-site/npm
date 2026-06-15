import nowts from "@3-/nowts";
import int from "@3-/int";
import rank from "./rank.js";

const LIMIT_MAX = 10000,
  save = async (db, chunk, now) => {
    const sql_select =
        "SELECT ipv4 FROM proxy WHERE ipv4 IN(" + chunk.map(() => "?").join(",") + ")",
      args_select = chunk.map(([u32]) => u32),
      rows = await db.execute(sql_select, args_select),
      exist_set = new Set(rows.map(([ipv4]) => ipv4)),
      args_insert = [],
      chunk_insert = [];

    for (const [u32, [kind, port]] of chunk) {
      if (!exist_set.has(u32)) {
        exist_set.add(u32);
        args_insert.push(u32, port, kind, rank(0n, 0n, now), now);
        chunk_insert.push("(?,?,?,?,?)");
      }
    }

    if (chunk_insert.length) {
      const sql_insert =
        "INSERT INTO proxy(ipv4,port,kind,`rank`,cts)VALUES" + chunk_insert.join(",");
      await db.execute(sql_insert, args_insert);
    }
  };

/*
保存代理数据至数据库
db: 数据库连接
ip_li: 代理数据列表 [[u32, [kind, port]], ...]
*/
export default async (db, ip_li) => {
  const { length: len } = ip_li,
    limit = 500,
    now = BigInt(nowts());

  /* 分批批量写入 */
  for (let i = 0; i < len; i += limit) {
    await save(db, ip_li.slice(i, i + limit), now);
  }

  const [[count]] = await db.execute("SELECT COUNT(1) FROM proxy"),
    over = int(count) - LIMIT_MAX;
  if (over > 0) {
    await db.execute("DELETE FROM proxy ORDER BY `rank` ASC,cts ASC LIMIT ?", [over]);
  }
};
