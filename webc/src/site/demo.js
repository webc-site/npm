import { readdirSync, existsSync, statSync } from "node:fs";
import { join, basename, dirname, relative, resolve } from "node:path";
import write from "@3-/write";
import read from "@3-/read";
import { minifyTo } from "@1-/rolldown";
import vfsPlugin from "../npm/plugin/vfs.js";
import define from "../lib/define.js";
import compileI18n, { compileYml } from "../lib/i18nYml.js";
import { parseI18nKeys, compileI18nKeys } from "../lib/i18nKey.js";
import webcLsIgnore from "../lib/import/webcLsIgnore.js";
import injectDefault from "../lib/injectDefault.js";
import vfsDemoI18N from "../vfs/webc/demo/I18N.js";

import stylSvgMap from "../lib/stylSvgMap.js";
import styleCode from "../lib/styleCode.js";
import rolldownOpt from "../lib/rolldownOpt.js";
import svgMapWrite from "../lib/svgMapWrite.js";
import jsImportResolve from "../lib/jsImportResolve.js";
import pugCt from "../lib/ct.js";

const WEBC = "webc",
  resolveDemoExternalJs = (js_dir, webc_dir) => ({
    name: "resolve-demo-external-js",
    resolveId: (source, importer) => {
      if (!importer) return null;

      if (source === "../../js/dom.js" || source === "./js/dom.js") {
        return {
          id: "../../js/dom.js",
          external: true
        };
      }

      if (source.endsWith(".js")) {
        if (source.startsWith("./svg/")) {
          return {
            id: "../../svg/" + source.slice(6),
            external: true
          };
        }
        if (source.startsWith("../../svg/")) {
          return {
            id: source,
            external: true
          };
        }
      }

      if (source === "./I18N.js") {
        return resolve(dirname(importer), source);
      }

      if (source.startsWith("./i18n/")) {
        const comp_dir = dirname(importer).endsWith("/demo")
            ? dirname(dirname(importer))
            : dirname(importer),
          comp_name = basename(comp_dir);
        return {
          id: "./" + comp_name + "/" + source.slice(7),
          external: true
        };
      }

      if (source.startsWith("./") && source.endsWith(".js")) {
        return {
          id: source,
          external: true
        };
      }

      const js_res = jsImportResolve(source, importer, js_dir, "../../js/");
      if (js_res) {
        if (typeof js_res === "object") return js_res;
        const abs = js_res;
        if (abs.startsWith(webc_dir + "/")) {
          const rel_webc = relative(webc_dir, abs),
            part_li = rel_webc.split("/");

          if (part_li.length >= 2 && part_li[1] === "demo") {
            return null;
          }

          const name = part_li[0];
          return {
            id: "../../" + (part_li.length === 1 && name.endsWith(".js") ? name : name + ".js"),
            external: true
          };
        }
      }

      return null;
    }
  }),
  stylDemoPlugin = (svg_map) => {
    const pugRender = async (demo_dir) => {
        const [htm] = pugCt(join(demo_dir, "_.pug"), read);
        return htm ? "export const HTM = " + JSON.stringify(htm) + ";\n" : "";
      },
      processStyl = async (styl_code, styl_path, demo_dir) => {
        const comp_name = basename(dirname(demo_dir)),
          [css_content, hash_set] = await stylSvgMap(styl_code, styl_path, svg_map);
        let import_line = 'import "../../' + comp_name + '.js";\n';
        for (const hash of hash_set) {
          import_line += 'import "../../svg/' + hash + '.js";\n';
        }
        return [css_content, import_line];
      };

    return {
      name: "styl-demo-plugin",
      transform: async (code, id) => {
        if (id.endsWith(".styl")) {
          const demo_dir = dirname(id),
            [css_content, import_line] = await processStyl(code, id, demo_dir),
            htm_code = await pugRender(demo_dir),
            htm_css = htm_code ? htm_code + "export const CSS = [];\n" : "";

          let i18n_import = "",
            c_tran_code = "";
          if (existsSync(join(demo_dir, "i18n"))) {
            i18n_import = 'import { $ as _i18n$ } from "./I18N.js";\n';
            c_tran_code =
              'await (await import("../../../js/c-t.js")).cTranSet(root, async (c) => (await _i18n$(c)).pug);';
          }

          return {
            code:
              import_line +
              i18n_import +
              htm_css +
              'import {newEl} from "../../js/dom.js";\nexport default async (root) => { ' +
              c_tran_code +
              styleCode(css_content) +
              " };"
          };
        }

        if (id.endsWith("/demo/_.js") || id.endsWith("\\demo\\_.js")) {
          const demo_dir = dirname(id),
            styl_path = join(demo_dir, "_.styl");

          let import_line = 'import "../../' + basename(dirname(demo_dir)) + '.js";\n';
          if (existsSync(styl_path)) {
            const styl_code = await read(styl_path),
              [css_content, styl_import_line] = await processStyl(styl_code, styl_path, demo_dir);
            import_line = styl_import_line;
            const import_new_el = code.includes("newEl")
              ? ""
              : 'import {newEl} from "../../js/dom.js";\n';
            code = import_new_el + injectDefault(code, (param) => styleCode(css_content, param));
          }

          const htm_code = (await pugRender(demo_dir)) + "export const CSS = [];\n";

          return {
            code: import_line + htm_code + code
          };
        }
      }
    };
  },
  i18nDemoPlugin = {
    name: "i18n-demo-plugin",
    async load(id) {
      const [pathname] = id.split("?");
      if (pathname.endsWith("/I18N.js")) {
        const is_demo_i18n = pathname.endsWith("/demo/I18N.js"),
          comp_dir = is_demo_i18n ? dirname(dirname(pathname)) : dirname(pathname),
          comp_name = basename(comp_dir);

        if (existsSync(pathname)) {
          const code = await read(pathname),
            { code_li } = compileI18nKeys(code);
          return vfsDemoI18N(code_li.join("\n"), comp_name, "");
        }
        return vfsDemoI18N("", comp_name, "");
      }
    }
  };

export default async (root, site_dir, minify = false) => {
  const ignore = await webcLsIgnore(root),
    webc_dir = join(root, "src", WEBC),
    js_dir = join(root, "src", "js"),
    out_demo_dir = join(site_dir, "_", "demo");

  if (!existsSync(webc_dir)) return;

  const input_map = {},
    out_map = {},
    svg_map = new Map(),
    define_env = await define(root, false);

  for (const name of readdirSync(webc_dir)) {
    if (ignore.test(name)) continue;

    const comp_dir = join(webc_dir, name);
    if (!statSync(comp_dir).isDirectory()) continue;

    const demo_dir = join(comp_dir, "demo");
    if (!existsSync(demo_dir) || !statSync(demo_dir).isDirectory()) continue;

    const js_file = join(demo_dir, "_.js"),
      styl_file = join(demo_dir, "_.styl"),
      has_js = existsSync(js_file),
      has_styl = existsSync(styl_file);

    if (!has_js && !has_styl) continue;

    const entry_file = has_js ? js_file : styl_file;
    input_map[name] = entry_file;
    out_map[name] = join(out_demo_dir, name + ".js");

    const i18n_dir = join(demo_dir, "i18n");
    if (existsSync(i18n_dir) && statSync(i18n_dir).isDirectory()) {
      const demo_i18n_js = join(demo_dir, "I18N.js"),
        has_demo_i18n = existsSync(demo_i18n_js),
        key_li = has_demo_i18n ? parseI18nKeys(await read(demo_i18n_js)) : [],
        comp_out_i18n_dir = join(out_demo_dir, name),
        [, pug_key_li] = pugCt(join(demo_dir, "_.pug"), read);

      for (const lang of readdirSync(i18n_dir)) {
        const lang_dir = join(i18n_dir, lang);
        if (statSync(lang_dir).isDirectory()) {
          const out_file = join(comp_out_i18n_dir, lang + ".js");
          if (has_demo_i18n) {
            const js_val = compileYml(join(lang_dir, "js.yml")),
              pug_val = compileYml(join(lang_dir, "pug.yml")),
              val_li = key_li.map((k) => js_val[k.value] ?? k.value),
              pug_val_li = pug_key_li ? pug_key_li.map((k) => pug_val[k] ?? k) : pug_val;
            write(
              out_file,
              "export const js = " +
                JSON.stringify(val_li) +
                ", pug = " +
                JSON.stringify(pug_val_li) +
                ";"
            );
          } else {
            write(out_file, compileI18n(lang_dir, pug_key_li));
          }
        }
      }
    }
  }

  if (Object.keys(input_map).length === 0) return;

  await minifyTo(
    input_map,
    out_map,
    rolldownOpt(define_env, minify, [
      resolveDemoExternalJs(js_dir, webc_dir),
      stylDemoPlugin(svg_map),
      i18nDemoPlugin,
      vfsPlugin
    ])
  );

  svgMapWrite(site_dir, svg_map);
};
