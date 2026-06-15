import { writeFile } from "node:fs/promises";

export default async (db, sql_path) => {
  const tables = await db.execute("SHOW TABLES");
  let sql_content = "";

  for (const [table] of tables) {
    const [[, create_sql]] = await db.execute("SHOW CREATE TABLE `" + table + "`");
    sql_content += create_sql.replace(/\s*AUTO_INCREMENT=\d+\b/g, "") + ";\n\n";
  }

  await writeFile(sql_path, sql_content.trim() + "\n");
};
