import read from "@1-/read";
import compileStylus from "@1-/stylus";

export default () => ({
  name: "vite-plugin-custom-stylus",
  enforce: "pre",
  async resolveId(source, importer) {
    const [pathname, query] = source.split("?");
    if (pathname.endsWith(".styl")) {
      const resolved = await this.resolve(source, importer, { skipSelf: true });
      if (resolved) {
        const [res_path, res_query] = resolved.id.split("?"),
          suffix = query || res_query,
          target_path = res_path.endsWith(".css") ? res_path : res_path + ".css";
        return suffix ? target_path + "?" + suffix : target_path;
      }
    }
  },
  async load(id) {
    const [pathname] = id.split("?");
    if (pathname.endsWith(".styl.css")) {
      const original_path = pathname.slice(0, -4);
      this.addWatchFile(original_path);

      const content = await read(original_path),
        renderer = compileStylus(content, {
          filename: original_path,
          sourcemap: true
        }),
        css = renderer.render();

      return {
        code: css,
        map: renderer.sourcemap
      };
    }
  },
  handleHotUpdate({ file, server }) {
    if (file.endsWith(".styl") || file.endsWith(".pug")) {
      const { moduleGraph, ws } = server,
        file_mods = moduleGraph.getModulesByFile(file);

      for (const [id, mod] of moduleGraph.idToModuleMap.entries()) {
        if (id.includes(file)) moduleGraph.invalidateModule(mod);
      }
      if (file_mods) {
        file_mods.forEach((mod) => moduleGraph.invalidateModule(mod));
      }
      ws.send({ type: "full-reload" });
      return [];
    }
  }
});
