import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";

/*
使用文件流计算文件的 md5 值
path: 文件绝对路径
返回值: Promise<Buffer> md5 二进制 Buffer
*/
export default (path) =>
  new Promise((resolve, reject) => {
    const hash = createHash("md5"),
      stream = createReadStream(path);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest()));
    stream.on("error", reject);
  });
