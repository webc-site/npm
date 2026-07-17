import all from "./all.js";
import parse from "./parse.js";

// 根据可选语言列表，依次匹配并 yield 符合系统当前语言环境的语言
export default function* (lang_list) {
  const lang_map = new Map();
  for (const lang of lang_list) {
    lang_map.set(parse(lang), lang);
  }

  for (const lang of all()) {
    const t = lang_map.get(lang);
    if (t) {
      yield t;
    }
  }
}
