# @1-/md5

使用文件流计算指定路径文件的 MD5 值。

## 安装

```bash
npm install @1-/md5
```

## 使用

```javascript
import pathMd5 from "@1-/md5/pathMd5.js";

const hash = await pathMd5("/path/to/file");
console.log(hash); // Uint8Array md5 二进制
```
