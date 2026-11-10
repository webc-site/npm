import { relative, resolve, dirname } from "node:path";

export default (source, importer, js_dir, prefix, import_set) => {
  if (source.startsWith(".") || source.startsWith("/")) {
    const abs = resolve(dirname(importer), source);
    if (abs.startsWith(js_dir + "/") || abs === js_dir) {
      if (import_set) import_set.add(abs);
      return {
        id: prefix + relative(js_dir, abs),
        external: true
      };
    }
    return abs;
  }
  return null;
};
