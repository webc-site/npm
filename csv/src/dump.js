import { writeFile } from "node:fs/promises";
import dumps from "./dumps.js";

export default async (path, li) => {
  await writeFile(path, dumps(li), "utf8");
};
