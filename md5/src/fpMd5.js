import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";

/*
文件路径流式计算 md5
fp: 文件绝对路径
返回值: Promise<Buffer> md5 二进制
*/
export default async (fp) => {
  const hash = createHash("md5");
  for await (const chunk of createReadStream(fp)) {
    hash.update(chunk);
  }
  return hash.digest();
};
