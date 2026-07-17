import { env } from "node:process";

// 依次生成环境变量中的语言、系统 locale，最后默认为 "en"
export default function* () {
  for (const key of ["LANGUAGE", "LC_ALL", "LC_MESSAGES", "LANG"]) {
    const val = env[key];
    if (val) {
      yield val;
    }
  }
  yield Intl.DateTimeFormat().resolvedOptions().locale;
  yield "en";
}
