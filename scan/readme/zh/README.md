# @1-/scan : 增量扫描目录文件并使用 SQLite 记录元数据

增量扫描目录文件，通过比对文件大小和修改时间检测变更，并同步至 SQLite 数据库中，最终返回有更新的相对路径列表。

## 功能介绍

- **增量扫描**：仅处理新增、修改或删除的文件，避免冗余的文件系统读写，提升同步速度。
- **路径压缩**：当相对路径长度小于等于 16 字节时保留原始字节；超出 16 字节则转换为 16 字节 MD5 值作为数据库主键，优化索引空间与查询性能。
- **元数据压缩**：使用 Varint（可变字节整型）编码方式压缩存储文件大小和修改时间。
- **事务安全**：将更新与删除操作合并在单个数据库事务中执行，确保数据一致性。
- **灵活过滤**：支持通过自定义回调函数过滤指定类型的文件与目录。
- **原生依赖**：基于 Bun 内置 `bun:sqlite` 模块，无需额外安装或编译数据库驱动。

## 使用演示

### 基础增量扫描

```javascript
import scan from "@1-/scan";

const dir = "./data";
const db_path = "./scan_record.db";

// 扫描目录并同步至 SQLite，返回发生变更的相对路径列表与更新函数
const [updated_paths, upsert] = await scan(dir, db_path);

// 退出作用域时自动关闭数据库
using _upsert = upsert;

console.log("更新文件列表：", updated_paths);

// 更新已处理文件的元数据至数据库
for (const rel_path of updated_paths) {
  await upsert(rel_path);
}
```

### 带有忽略规则的扫描

```javascript
import scan from "@1-/scan";

const dir = "./data";
const db_path = "./scan_record.db";

// 忽略特定文件或目录
const ignore = (kind, rel_path) => {
  return rel_path.startsWith("temp/") || rel_path === "config.json";
};

const [updated_paths, upsert] = await scan(dir, db_path, ignore);
using _upsert = upsert;

console.log("已同步，更新列表：", updated_paths);

for (const rel_path of updated_paths) {
  await upsert(rel_path);
}
```

## 设计思路

系统主入口调用各个独立模块完成增量扫描与数据同步流程。

```mermaid
graph TD
    Entry["_.js (主入口)"] -->|1. 初始化连接| Sqlite["sqlite.js"]
    Entry -->|2. 加载已有记录| Load["load.js"]
    Entry -->|3. 扫描文件系统并对比| DirWalk["dirWalk.js"]
    DirWalk -->|调用| Walk["@1-/walk/walkRelIgnore"]
    DirWalk -->|处理路径键| Hash["hash.js"]
    Entry -->|4. 删除失效记录并返回更新函数| Trans["trans.js"]
    Save["save.js (独立批量存储辅助模块)"] -->|事务保障| Trans
```

1. **初始化连接 (`sqlite.js`)**：打开 SQLite 数据库，并配置自动释放连接机制。
2. **加载记录 (`load.js`)**：若表不存在则自动创建，读取已记录的文件哈希、大小及修改时间，在内存中还原比对集合。
3. **文件系统扫描 (`dirWalk.js`)**：递归遍历目录，利用 `hash.js` 将路径映射为 16 字节键。对比当前文件与数据库元数据（利用 `@3-/vb` 进行压缩状态对比），筛选出新增和修改的文件。
4. **删除与返回更新函数**：使用 `trans.js` 开启事务，批量删除已被移除的无效记录，并返回变更的相对路径列表与 `upsert` 函数，供调用者按需持久化数据。
5. **独立批量存储辅助模块 (`save.js`)**：导出的独立工具模块，用于在单个事务中一次性批量写入与删除。

## 技术栈

- **Bun**：JavaScript 运行时及测试框架。
- **Bun SQLite**：内置的轻量级、高性能 SQLite 实现。
- **@1-/walk**：支持过滤规则的目录递归遍历工具。
- **@3-/vb**：Varint（可变字节）编码与解码器。
- **@3-/binmap / @3-/binset**：针对二进制键优化的 Map 和 Set 容器。

## 目录结构

```
.
├── src
│   ├── _.js          # 核心流程控制器，调度各模块并返回变更及更新函数
│   ├── dirWalk.js    # 遍历目录并比对元数据，输出变更队列
│   ├── hash.js       # 将文件相对路径编码或计算为固定 16 字节键
│   ├── load.js       # 查询数据库现有记录，若数据表缺失则执行初始化
│   ├── save.js       # 独立导出的批量持久化与删除辅助函数
│   ├── sqlite.js     # 创建并配置 SQLite 数据库实例
│   └── trans.js      # 封装 SQLite 事务，提供异常回滚机制
└── tests             # 单元测试模块
```

## 历史故事

SQLite 的诞生与军事应用密切相关。2000 年，D. Richard Hipp 在为美国海军陆战队设计导弹驱逐舰板载损害控制系统软件时，遇到商业数据库由于配置复杂、日常需要专业维护且一旦连接丢失便会导致整个软件瘫痪的问题。Hipp 随即着手设计了一套无需任何独立服务器、零配置且直接对本地文件进行读写的嵌入式数据库，这便是 SQLite。

为极限节约磁盘空间 and 降低读写延迟，SQLite 广泛应用了 Varint（可变字节整型）编码。在这种编码下，数值较小的整数（如常见的文件大小、序列号）仅占用 1 个字节，只有大数值才会占用更多字节。本项目中对文件大小和修改时间采用同样的压缩设计，从而秉承了 SQLite 极致节约空间与高效率的系统设计哲学。
