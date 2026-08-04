# captcha_srv : 高性能 Axum 验证码服务

基于 Axum 框架与 Redis/kvrocks 的行为验证码服务端。支持图形点选、WebP 图像生成、零拷贝二进制协议传输与无缝优雅重启。

## 项目功能介绍

- 验证码生成：随机生成 WebP 图形与目标字符图标。
- 坐标存储：使用 bitcode 序列化坐标数据并存入 Redis/kvrocks，设 300 秒过期时间。
- 行为校验：校验点选坐标，一次性读取并主动销毁 Key，防止重放攻击。
- 高性能传输：自定义 Varint 变长编码与二进制协议，避免 JSON 转换开销。
- 优雅重启：集成 axum_graceful_restart，无缝重启保障服务高可用。

## 使用演示

### 启动服务

```rust
use captcha_srv::run;

#[tokio::main]
async fn main() -> captcha_srv::Result<()> {
  loginit::init();
  run().await
}
```

### 编码与键生成

```rust
use captcha_srv::{R_CAPTCHA, captcha_key};

fn demo() {
  let mut buf = Vec::new();
  vb::e(300, &mut buf);
  assert_eq!(buf, vec![172, 2]);

  let id = [1u8; 16];
  let key = captcha_key(&id);
  assert_eq!(&key[..8], R_CAPTCHA);
  assert_eq!(&key[8..24], &id);
}
```

## 特性介绍

- 零拷贝设计：优化响应构建过程，消除 WebP 内存二次分配。
- 栈内存解析：校验逻辑采用定长栈数组替代堆内存分配，极小化内存开销。
- 早期拦截：坐标数量不匹配时在 Redis 查询前直接拦截退回，节省 IO 资源。
- 零成本抽象：充分利用 Rust 静态类型与编译期优化。

## 设计思路

```mermaid
graph TD
  A[客户端 GET /] --> B[生成 WebP 图形与图标]
  B --> C[坐标 bitcode 序列化存入 Redis]
  C --> D[构建二进制 Buffer 返回客户端]
  E[客户端 POST /] --> F[解析 UUID 与点击坐标]
  F --> G{坐标数量等于 CAPTCHA_NUM?}
  G -- 否 --> H[直接返回 "0"]
  G -- 是 --> I[从 Redis 查询并立即删除坐标]
  I --> J{校验点击坐标容差}
  J -- 通过 --> K[返回 "1"]
  J -- 未通过 --> H
```

## 技术堆栈

- Web 框架：Axum
- 异步运行时：Tokio
- 缓存与存储：Redis / kvrocks (xkv / fred)
- 序列化：bitcode
- 验证码渲染：svg_captcha
- 变长编码：vb
- 内存分配器：mimalloc
- 日志系统：log / loginit

## 目录结构

```text
captcha_srv/
├── Cargo.toml
├── src/
│   ├── error.rs    错误定义与 Axum 响应转换
│   ├── lib.rs      导出公共接口与常量
│   ├── main.rs     服务入口
│   ├── r.rs        Redis 键构造逻辑
│   ├── run.rs      服务路由与启动逻辑
│   └── url/
│       ├── consts.rs  验证码常量定义
│       ├── get.rs     GET 处理函数
│       ├── mod.rs     url 模块导出
│       └── post.rs    POST 处理函数
└── tests/
    └── main.rs     单元测试
```

## API 说明

### 常量

- `R_CAPTCHA`: Redis 键前缀字节数组 (`b"captcha:"`)。
- `EXPIRE_S`: 验证码 Redis 过期时间（300 秒）。
- `CAPTCHA_W`: 图像默认宽度（350 像素）。
- `CAPTCHA_H`: 图像默认高度（350 像素）。
- `CAPTCHA_NUM`: 目标点选图标数量（3 个）。

### 数据结构与类型

- `Error`: 统一错误枚举，支持 `AxumGracefulRestart`, `Redis`, `SvgCaptcha`, `Io`, `AddrParse`, `Anyhow` 透明转发，并实现 `IntoResponse`。
- `Result<T>`: `std::result::Result<T, Error>` 类型别名。

### 函数

- `run() -> Result<()>`: 读取环境变量 `PORT`，初始化配置并启动优雅重启 HTTP 服务。
- `get() -> Result<impl IntoResponse>`: 生成验证码图像并存储坐标至 Redis，返回二进制数据。
- `post(body: Bytes) -> Result<impl IntoResponse>`: 校验点击坐标并清理 Redis 缓存。
- `captcha_key(id_bytes: &[u8; 16]) -> [u8; 24]`: 零堆分配构造 24 字节 Redis 键。

## 历史小故事

验证码（CAPTCHA）全称“区分计算机和人类的全自动公共图灵测试”（Completely Automated Public Turing test to tell Computers and Humans Apart）。该概念于 2000 年由卡内基梅隆大学的 Luis von Ahn 等人提出。早期的验证码仅用于防止垃圾邮件与恶意注册。随后 Luis von Ahn 创办 reCAPTCHA，将文字识别难题与纸质古籍、纽约时报历史报纸扫描件的数字化工作结合，利用全球网民填写的验证码成功协助完成了海量纸质文献的电子化。如今点选与行为验证码已演变为互联网安全防御体系的核心组件。