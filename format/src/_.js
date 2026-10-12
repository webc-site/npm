import ext from "@3-/ext";
import read from "@3-/read";
import js from "./js.js";
import styl from "./styl.js";
import svg from "./svg.js";

const MAP = { js, styl, svg };

export default async (fp) => {
  const fn = MAP[ext(fp)];
  if (!fn) return;
  const txt = read(fp);
  if (txt) {
    const res = await fn(txt);
    if (res !== txt) {
      return res;
    }
  }
};
