import { join, resolve, dirname } from "node:path";
import bundle from "@1-/rolldown";
import importLi from "@1-/jsparser/importLi.js";

export default async (file_path, webc_dir, comp) => {
  const chunk_li = await bundle([file_path], {
      external: (id, importer) => {
        if (!importer) return false;
        if (id.endsWith(".styl") || id.endsWith("I18N.js")) return true;
        if (id.startsWith(".") || id.startsWith("/")) {
          const abs = resolve(dirname(importer), id),
            comp_subdir = join(webc_dir, comp) + "/";
          if (abs.startsWith(comp_subdir)) {
            return false;
          }
        }
        return true;
      },
      treeshake: { moduleSideEffects: true }
    }),
    code = chunk_li.map((item) => item[1]).join("\n"),
    [static_li, dynamic_li] = importLi(code);
  return [...static_li, ...dynamic_li];
};
