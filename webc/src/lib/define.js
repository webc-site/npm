import { join } from "node:path";

export default async (root, is_dev = false) => {
  const define = (await import(join(root, "src/conf/define.js"))).default,
    conf = await define(is_dev),
    r = {
      "import.meta.env.DEV": JSON.stringify(is_dev)
    };
  for (const [k, v] of Object.entries(conf)) {
    r[k] = JSON.stringify(v);
  }
  return r;
};
