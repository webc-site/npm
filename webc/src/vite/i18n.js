import norm from "./norm.js";
import { existsSync } from "node:fs";
import { dirname, join, isAbsolute } from "node:path";
import { TRANSFORM_LI } from "../lib/vfs.js";
import vfsI18N from "../vfs/webc/I18N.js";
import vfsDemoI18N from "../vfs/webc/demo/I18N.js";
import i18nYml from "./i18nYml.js";

const I18N_RE = /\/i18n\/([a-zA-Z0-9_-]+)\.js$/,
  demoI18N = (code = "") => vfsDemoI18N(code, "i18n", "/* @vite-ignore */ ");

export default () => {
  let root = "";
  return {
    name: "vite-plugin-i18n-default-export",
    enforce: "pre",
    configResolved(config) {
      root = config.root || "";
    },
    resolveId(source, importer) {
      let [pathname, query] = source.split("?");
      if (root) {
        pathname = norm(pathname, root);
      }
      let importer_path = "";
      if (importer) {
        let importer_query = "";
        [importer_path, importer_query] = importer.split("?");
        if (root) {
          importer_path = norm(importer_path, root);
          importer = importer_path + (importer_query ? "?" + importer_query : "");
        }
        if (pathname === "./I18N.js") {
          const demo_i18n_dir = join(dirname(importer_path), "i18n");
          if (existsSync(demo_i18n_dir)) {
            return join(dirname(importer_path), "I18N.js");
          }
        }
      }
      if (pathname.endsWith(".js") && pathname.includes("/i18n/")) {
        const match = pathname.match(I18N_RE);
        if (match) {
          const resolved_path = isAbsolute(pathname)
            ? pathname
            : importer_path
              ? join(dirname(importer_path), pathname)
              : pathname;
          if (existsSync(resolved_path)) {
            return;
          }
          return query ? resolved_path + "?" + query : resolved_path;
        }
      }
      if (pathname.endsWith("/demo/_.js") && !existsSync(pathname)) {
        return query ? pathname + "?" + query : pathname;
      }
    },
    load(id) {
      let [pathname] = id.split("?");
      if (root) {
        pathname = norm(pathname, root);
      }
      if (existsSync(pathname)) {
        return;
      }
      if (pathname.endsWith("/demo/_.js")) {
        return "export default () => {};";
      }
      const is_i18n = pathname.endsWith("/demo/I18N.js");
      if (is_i18n) {
        const dir = dirname(dirname(pathname)),
          demo_i18n_dir = join(dir, "demo", "i18n");
        if (existsSync(demo_i18n_dir)) {
          return demoI18N();
        }
      }
      const match = pathname.match(I18N_RE);
      if (match) {
        return i18nYml(pathname, match);
      }
    },
    transform(code, id) {
      const [pathname] = id.split("?");
      if (pathname.endsWith("/demo/I18N.js")) {
        if (existsSync(pathname)) {
          return {
            code: demoI18N(code),
            map: null
          };
        }
        return;
      }
      if (pathname.endsWith("/I18N.js")) {
        return {
          code: vfsI18N(code),
          map: null
        };
      }
      for (const [suffix, fn] of TRANSFORM_LI) {
        if (suffix.endsWith("I18N.js")) continue;
        if (pathname.endsWith("/" + suffix)) {
          let dir = pathname;
          const depth = suffix.split("/").length;
          for (let i = 0; i < depth; ++i) {
            dir = dirname(dir);
          }
          const res = fn(code, dir);
          if (res !== code) {
            return {
              code: res,
              map: null
            };
          }
        }
      }
    }
  };
};
