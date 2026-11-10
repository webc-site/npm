import { join } from "node:path";
import write from "@3-/write";

export default (out_dir, svg_map) => {
  for (const [hash, def_set] of svg_map) {
    write(
      join(out_dir, "svg", hash + ".js"),
      "import {css} from '../js/dom.js';css(" + JSON.stringify([...def_set].join("")) + ");"
    );
  }
};
