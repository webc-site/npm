import int from "@3-/int";

const LIMIT_MAX = 3000000,
  LIMIT_BATCH = 500,
  save = async (db, chunk) => {
    const rows = await db.execute(
        "SELECT ipv4 FROM proxy WHERE ipv4 IN(" + chunk.map(() => "?").join(",") + ")",
        chunk.map(([u32]) => u32),
      ),
      exist_set = new Set(rows.map(([ipv4]) => ipv4)),
      args_insert = [],
      new_li = [];

    for (const [u32, [kind, port]] of chunk) {
      if (!exist_set.has(u32)) {
        exist_set.add(u32);
        args_insert.push(u32, port, kind);
        new_li.push("(?,?,?)");
      }
    }

    if (new_li.length) {
      await db.execute("INSERT INTO proxy(ipv4,port,kind)VALUES" + new_li.join(","), args_insert);
    }
  };

/*
保存代理数据至数据库
db: 数据库连接
ip_li: 代理数据列表 [[u32, [kind, port]], ...]
*/
export default async (db, ip_li) => {
  /* 分批批量写入 */
  for (let i = 0; i < ip_li.length; i += LIMIT_BATCH) {
    await save(db, ip_li.slice(i, i + LIMIT_BATCH));
  }

  const [[count]] = await db.execute("SELECT COUNT(1) FROM proxy"),
    over = int(count) - LIMIT_MAX;
  if (over > 0) {
    await db.execute("DELETE FROM proxy ORDER BY `rank` ASC LIMIT ?", [over]);
  }
};
