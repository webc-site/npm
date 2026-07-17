import { createHash } from "node:crypto";
import fmt from "@1-/fmt";
import utf8e from "@3-/utf8/utf8e.js";

/*
格式化文本并计算 md5
txt: 文本内容
返回值: Promise<Buffer> md5 二进制
*/
export default async (txt) =>
  createHash("md5")
    .update(utf8e(await fmt(txt)))
    .digest();
