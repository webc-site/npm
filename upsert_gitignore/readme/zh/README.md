# @1-/upsert_gitignore : 安全幂等更新 .gitignore 规则

## 功能介绍

安全追加忽略规则至目标文件，具备幂等特性。

通过存在性检查避免重复条目。

处理边界情况：自动创建父级目录、去除空格、过滤空行。

## 使用演示

```javascript
import upsertGitignore from "@1-/upsert_gitignore";

const filePath = "./.gitignore";

// 若未包含 "node_modules"，则追加
upsertGitignore(filePath, "node_modules");

// 幂等：已存在时无操作
upsertGitignore(filePath, "node_modules");

// 支持多规则批量处理
upsertGitignore(filePath, ["dist", ".env", "node_modules"]);
```

## 设计思路

```mermaid
graph TD
    A[开始] --> B{文件是否存在?}
    B -- 否 --> C[创建父级目录]
    C --> D[写入初始规则]
    D --> E[结束]
    B -- 是 --> F[读取文件内容]
    F --> G[按行切分]
    G --> H[去除空格、过滤空行]
    H --> I{规则是否已存在?}
    I -- 是 --> E
    I -- 否 --> J[追加新规则]
    J --> K[换行符拼接]
    K --> L[写入更新后内容]
    L --> E
```

## 技术栈

- 运行环境：Bun / Node.js
- 核心依赖：`@3-/txt_li`、`@3-/write`、`@3-/read`
- 许可证：MulanPSL-2.0

## 代码结构

```
src/
└── _.js      # 核心实现
tests/
└── _.test.js # 单元测试
```

## 历史故事

Git 于 2005 年引入 `.gitignore` 管理版本控制排除规则。早期工作流依赖手动编辑或脆弱的 Shell 脚本，如 `echo "node_modules" >> .gitignore`。

现代开发需要可靠的自动化能力。本库源于 CI/CD 流水线和项目脚手架工具中确定性配置管理的需求。

幂等设计确保执行频率不影响最终状态——这是基础设施即代码和声明式配置系统的关键特性。