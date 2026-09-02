import { join } from "node:path";

export default async (root) => (await import(join(root, "src/js/i18n/CODE.js"))).default;
