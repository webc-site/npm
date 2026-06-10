---
name: bash2sh
---

改写 bash 为 js

以 `#!/usr/bin/env bun` 开头，可执行

尽可能用 import 导入包走进程内，而不是 `$` 调用 bash

如果需要运行 bash， `import {$} from "zx"`

`bun i -D` 安装缺少的依赖
