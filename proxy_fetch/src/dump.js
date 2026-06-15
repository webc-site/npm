import { writeFile } from "node:fs/promises";

export default async (db, sql_path) => {
  const tables = await db.unsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
    ),
    sqls = await Promise.all(
      tables.map(async ({ table_name }) => {
        const [{ "Create Table": create_sql }] = await db.unsafe(
          "SHOW CREATE TABLE `" + table_name + "`",
        );
        return create_sql.replace(/\s*AUTO_INCREMENT=\d+\b/g, "") + ";\n\n";
      }),
    );

  await writeFile(sql_path, sqls.join("").trim() + "\n");
};
