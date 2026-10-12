import compileStylus from "@1-/stylus";
import { transform } from "lightningcss";

export default (content, filename = "_.css", minify = true) => {
  const renderer = compileStylus(content, {
      filename,
      sourcemap: false
    }),
    css = renderer.render(),
    { code } = transform({
      filename,
      code: Buffer.from(css),
      minify
    });
  return Buffer.from(code).toString("utf8");
};
