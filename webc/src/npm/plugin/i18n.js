import { dirname, basename } from "node:path";
import { parseI18nKeys, compileI18nKeys } from "../../lib/i18nKey.js";

export { parseI18nKeys };

export default (comp_name_to_idx) => ({
  name: "i18n-plugin",
  transform: (code, id) => {
    const [path_name] = id.split("?");
    if (path_name.endsWith("/I18N.js")) {
      const { code_li } = compileI18nKeys(code),
        comp_name = basename(dirname(path_name)),
        comp_idx = comp_name_to_idx.get(comp_name);
      code_li.push(
        "export default async (code) => (await import(`./i18n/${code}.js`)).default[" +
          comp_idx +
          "];"
      );
      return {
        code: code_li.join("\n")
      };
    }
  }
});
