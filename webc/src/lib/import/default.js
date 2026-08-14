import { join } from "node:path";

export default async (...path_li) => (await import(join(...path_li))).default;
