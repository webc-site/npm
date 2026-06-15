import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";

/*
文件路径计算 md5
path: 文件绝对路径
返回值: Promise<Uint8Array> md5 二进制
*/
export default async (path) => {
  const hash = createHash("md5"),
    stream = createReadStream(path);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest();
};
