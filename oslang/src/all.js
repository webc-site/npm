import raw from "./_.js";
import parse from "./parse.js";

// 生成所有已去重的语言代码，包含区域语言及其父语言（如 zh-cn 和 zh）
export default function* () {
  const seen_set = new Set();
  for (const item of raw()) {
    const lang = parse(item);
    if (lang) {
      if (!seen_set.has(lang)) {
        seen_set.add(lang);
        yield lang;
      }
      const dash_idx = lang.indexOf("-");
      if (dash_idx > 0) {
        const parent_lang = lang.slice(0, dash_idx);
        if (!seen_set.has(parent_lang)) {
          seen_set.add(parent_lang);
          yield parent_lang;
        }
      }
    }
  }
}
