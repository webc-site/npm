import ext from "@3-/ext";
import read from "@1-/read";
import fmtMd5 from "./fmtMd5.js";
import fpMd5 from "./fpMd5.js";

const EXT_SET = new Set(["md", "txt", "yml", "toml", "yaml", "html"]);

/*
文件路径计算 md5
fp: 文件绝对路径
返回值: Promise<Buffer> md5 二进制
*/
export default async (fp) => {
  if (EXT_SET.has(ext(fp))) {
    return fmtMd5(await read(fp));
  }
  return fpMd5(fp);
};
