import { readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import write from "@3-/write";
import i18nCode from "./i18nCode.js";
import imports from "./ls/imports.js";
import jsTitle from "./ls/md/js.js";
import webcTitle from "./ls/md/webc.js";
import webcLsIgnore from "./import/webcLsIgnore.js";

const sort = (arr) => arr.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)),
  fmtVal = (arr) => JSON.stringify(arr).replace(/\],\[/g, "],  ["),
  fmt = (dict) =>
    "export const " +
    Object.entries(dict)
      .map(([k, v]) => k + " = " + fmtVal(sort(v)))
      .join(", ") +
    ";\n";

export default async (root, out_dir) => {
  const code_li = await i18nCode(root),
    ignore = await webcLsIgnore(root),
    src_dir = join(root, "src"),
    webc_dir = join(src_dir, "webc"),
    js_dir = join(src_dir, "js"),
    file_li = readdirSync(webc_dir).filter((f) => {
      if (f.startsWith(".")) return false;
      if (!f.endsWith(".js")) return false;
      const stat = statSync(join(webc_dir, f));
      return stat.isFile();
    }),
    all_comp_li = file_li.map((f) => f.slice(0, -3)),
    component_li = all_comp_li.filter((name) => !ignore.test(name)),
    comp_dep_map = {},
    has_non_stylus_or_non_comp_map = {},
    js_set = new Set();

  for (const comp of all_comp_li) {
    const file_path = join(webc_dir, comp + ".js");
    if (!existsSync(file_path)) continue;

    const import_li = await imports(file_path, webc_dir, comp),
      dep_set = new Set();
    let non_stylus_or_non_comp = false;

    for (const imp of import_li) {
      if (imp.endsWith(".styl")) {
        continue;
      }
      const resolved = resolve(webc_dir, imp);
      if (resolved.startsWith(webc_dir + "/")) {
        const rel = relative(webc_dir, resolved),
          dep_comp = rel.split("/")[0].replace(/\.js$/, "");
        if (dep_comp !== comp && all_comp_li.includes(dep_comp)) {
          dep_set.add(dep_comp);
        } else {
          non_stylus_or_non_comp = true;
        }
      } else {
        non_stylus_or_non_comp = true;
        if (resolved.startsWith(js_dir + "/")) {
          const rel = relative(js_dir, resolved),
            js_name = rel.replace(/\.js$/, "");
          js_set.add(js_name);
        }
      }
    }

    if (!ignore.test(comp)) {
      comp_dep_map[comp] = dep_set;
      has_non_stylus_or_non_comp_map[comp] = non_stylus_or_non_comp;
    }
  }

  // 不动点迭代分类出 CSS 纯样式组件
  const is_css_map = {};
  for (const comp of component_li) {
    is_css_map[comp] = false;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const comp of component_li) {
      if (!has_non_stylus_or_non_comp_map[comp]) {
        let is_all_dep_css = true;
        for (const dep of comp_dep_map[comp]) {
          if (!is_css_map[dep]) {
            is_all_dep_css = false;
            break;
          }
        }
        if (is_all_dep_css && !is_css_map[comp]) {
          is_css_map[comp] = true;
          changed = true;
        }
      }
    }
  }

  // 将组件分类为 css, base, webc
  const cat_map = {};
  for (const comp of component_li) {
    if (is_css_map[comp]) {
      cat_map[comp] = "css";
    } else {
      let has_non_css_dep = false;
      for (const dep of comp_dep_map[comp]) {
        if (!is_css_map[dep]) {
          has_non_css_dep = true;
          break;
        }
      }
      cat_map[comp] = has_non_css_dep ? "webc" : "base";
    }
  }

  // 为每个语言生成列表文件
  for (const lang of code_li) {
    const js_li = [],
      list_map = { webc: [], css: [], base: [], js: js_li };

    for (const name of js_set) {
      const file_path = join(root, "doc", lang, "js", name + ".md");
      if (existsSync(file_path)) {
        js_li.push([name, jsTitle(file_path)]);
      }
    }

    for (const comp of component_li) {
      const cat = cat_map[comp],
        readme_path = join(webc_dir, comp, "i18n", lang, "README.md"),
        title = webcTitle(readme_path, comp);

      list_map[cat].push([comp, title]);
    }

    // 格式化输出内容，使列表项之间有双空格分隔
    const content = fmt(list_map),
      out_file_path = join(out_dir, lang + ".js");
    write(out_file_path, content);
  }
  return js_set;
};
