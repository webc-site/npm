import stylSvgMap from "../../lib/stylSvgMap.js";

export default (svg_map) => ({
  name: "styl-plugin",
  transform: async (code, id) => {
    if (id.endsWith(".styl")) {
      const [css_content, hash_set] = await stylSvgMap(code, id, svg_map);
      let import_line = "";
      for (const hash of hash_set) {
        import_line += 'import "./svg/' + hash + '.js";';
      }

      return {
        code:
          import_line + "import {css} from './js/dom.js';css(" + JSON.stringify(css_content) + ");"
      };
    }
  }
});
