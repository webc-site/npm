import read from "@3-/read";
import write from "@3-/write";
import compileCss from "./styl/css.js";

export default async (path, out, minify = true) => {
  const content = await read(path);
  write(out, compileCss(content, path, minify));
};
