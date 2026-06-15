import { writeFile } from "node:fs/promises";

export default async (db, sql_path) => {
  const tables = await db.unsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
  );
  let sql_content = "";

  for (const { table_name } of tables) {
    const [{ "Create Table": create_sql }] = await db.unsafe(
      "SHOW CREATE TABLE `" + table_name + "`",
    );
    sql_content += create_sql.replace(/\s*AUTO_INCREMENT=\d+\b/g, "") + ";\n\n";
  }

  await writeFile(sql_path, sql_content.trim() + "\n");
};
