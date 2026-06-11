# @1-/md5

Calculate the MD5 hash of a file at a given path using a read stream.

## Installation

```bash
npm install @1-/md5
```

## Usage

```javascript
import pathMd5 from "@1-/md5/pathMd5.js";

const hash = await pathMd5("/path/to/file");
console.log(hash); // Uint8Array (MD5 binary)
```
