import { basename, relative } from "node:path";
import jsImportResolve from "../../lib/jsImportResolve.js";

const compByPath = (path, webc_dir) => {
  if (!path.startsWith(webc_dir + "/")) return null;
  const rel = relative(webc_dir, path),
    part_li = rel.split("/"),
    first = part_li[0];
  if (part_li.length === 1 && first.endsWith(".js")) {
    return first.slice(0, -3);
  }
  return first;
};

export default (src_js_dir, webc_dir, imported_js_file_set) => ({
  name: "resolve-external-js",
  resolveId: (source, importer) => {
    if (!importer) return null;
    if (source.startsWith("./svg/") && source.endsWith(".js")) {
      return {
        id: source,
        external: true
      };
    }
    if (source.startsWith("./js/")) {
      return {
        id: source,
        external: true
      };
    }
    const res = jsImportResolve(source, importer, src_js_dir, "./js/", imported_js_file_set);
    if (!res) return null;
    if (typeof res === "object") return res;

    const abs = res,
      importer_comp = compByPath(importer, webc_dir),
      imported_comp = compByPath(abs, webc_dir);
    if (importer_comp && imported_comp && importer_comp !== imported_comp) {
      return {
        id: "./" + basename(abs),
        external: true
      };
    }
    return null;
  }
});
