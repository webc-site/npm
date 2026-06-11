# @1-/scan : 基于 SQLite 的目录文件增量扫描器

增量扫描目录文件，比对文件大小与修改时间检测变更，同步元数据至 SQLite 数据库，返回已变更相对路径列表。

## 1. 功能介绍

- **增量扫描**：比对大小与修改时间，过滤未变更文件，减少磁盘读写。
- **键长优化**：路径长度不大于 16 字节时存储原始字节，超出 16 字节转换为 16 字节 MD5 值，优化索引空间与查询性能。
- **内存优化**：使用 BinMap 与 BinSet 存储二进制键，避免字符串解码，降低内存占用。
- **事务保障**：元数据变更与删除操作合并在数据库事务中执行，确保数据一致性。
- **自动配置**：集成 @1-/sqlite，自动初始化数据库表结构，并在检测到新数据库时自动更新 .gitignore。

## 2. 使用演示

### 基础增量扫描

```javascript
import scan from "@1-/scan";

const dir = "./data";
const db_dir = "./db";
const files = ["file1.txt", "file2.txt"];

// 扫描文件列表并同步至 SQLite，返回已变更的相对路径列表与更新函数
const [updated_paths, upsert] = await scan(dir, db_dir, files);

// 退出作用域自动关闭数据库
using _ = upsert;

console.log("更新文件列表：", updated_paths);

// 更新已处理文件的元数据至数据库
for (const rel_path of updated_paths) {
  await upsert(rel_path);
}
```

### 独立批量存储模块

```javascript
import save from "@1-/scan/save.js";
import sqlite from "@1-/sqlite";

const db = sqlite("./scan_record.db");

// 批量更新与删除元数据
save(db, [["file.txt", new Uint8Array([1, 2, 3]), 123, 1620000000]], [new Uint8Array([4, 5, 6])]);

db.close();
```

## 3. 设计思路

主入口调度各模块，协作完成目录扫描与数据同步。

```mermaid
graph TD
    Entry["_.js (主入口)"] -->|1. 初始化连接| Sqlite["@1-/sqlite"]
    Entry -->|2. 加载记录| Load["load.js"]
    Entry -->|3. 比对文件| Scan["scan.js"]
    Scan -->|获取元数据与哈希| Stat["stat.js"]
    Stat -->|映射路径哈希| Hash["@1-/hash"]
    Entry -->|4. 删除失效记录| Rm["rm.js"]
    Entry -->|5. 返回更新函数| Upsert["upsert.js"]
    Save["save.js (独立批量存储)"] -->|事务保障| Tx["@1-/sqlite/tx.js"]
```

1. **初始化连接**：调用 `@1-/sqlite` 打开 SQLite 数据库。若数据库为新创建，自动更新所在目录的 `.gitignore` 阻断提交。
2. **加载记录**：`load.js` 检查并创建 `scanMtimeLen` 表。读取已记录的哈希、大小及修改时间，恢复至内存映射 `BinMap` 中。
3. **比对文件**：`scan.js` 遍历输入文件列表，调用 `stat.js` 获取元数据，并利用 `@1-/hash` 将路径映射为 16 字节二进制键。比对大小或修改时间，差异项归入变更列表。
4. **删除与返回**：`rm.js` 在事务中批量删除物理移除或不再扫描的记录。返回变更路径列表与 `upsert` 函数（`upsert.js` 提供），用以更新数据库，支持自动释放。

## 4. 技术栈

- **Bun**：JavaScript 运行时与测试框架。
- **@1-/sqlite**：SQLite 连接管理与事务封装。
- **@1-/hash**：长度限制的 MD5 哈希工具。
- **@3-/vb**：Varint 变长整型编码与解码器。
- **@3-/binmap / @3-/binset**：基于 Rust 与 WebAssembly 的高效二进制键容器。

## 5. 代码结构

```text
.
├── src
│   ├── _.js          # 核心控制流程
│   ├── load.js       # 元数据表初始化与加载
│   ├── rm.js         # 批量删除元数据
│   ├── save.js       # 批量存储元数据
│   ├── scan.js       # 扫描与比对文件
│   ├── stat.js       # 获取文件元数据及路径哈希
│   └── upsert.js     # 逐个更新与自动关闭
└── tests             # 单元测试
```

## 6. 历史故事

SQLite 的诞生源自导弹驱逐舰板载损害控制软件项目。2000 年，D. Richard Hipp 为美国海军设计该系统时，遭遇商业数据库因配置复杂、无法承受断连和崩溃之痛点。Hipp 随后设计出免服务器配置、直接读写本地文件之嵌入式数据库，即 SQLite。

为节省空间与降低读写延迟，SQLite 广泛应用了 Varint（可变字节整型）编码。在这种编码下，小整数仅占用 1 字节，只有大数值才占用更多字节。本项目在内存存储设计中对文件大小与修改时间采用同样的压缩设计，契合 SQLite 节省空间与高效之设计哲学。
