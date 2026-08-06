# Cloudflare Workers

知识可能过时。处理 Workers、KV、R2、D1、Durable Objects、Queues、Vectorize、AI 或 Agents SDK 任务前，先查阅最新文档。

## 文档

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

配额与限制查阅各产品 `/platform/limits/` 页面（如 `/workers/platform/limits`）。

## 命令

| 命令 | 用途 |
|---|---|
| `bunx wrangler dev` | 本地开发 |
| `bunx wrangler deploy` | 部署至 Cloudflare |
| `bunx wrangler types` | 生成 TypeScript 类型 |

修改 wrangler.toml 绑定后运行 `bunx wrangler types`。

## Node.js 兼容性

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## 错误处理

- **Error 1102**（CPU/内存超限）：查阅 `/workers/platform/limits/`
- **错误汇总**：https://developers.cloudflare.com/workers/observability/errors/

## 产品文档

API 引用与限制：
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

## 最佳实践

涉及 Durable Objects 或 Workflows 时参阅：

- Durable Objects: https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- Workflows: https://developers.cloudflare.com/workflows/build/rules-of-workflows/
