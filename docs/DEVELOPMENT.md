# DEVELOPMENT.md - 开发规范与流程

**文档定位**: 环境搭建、编码规范、测试策略、CI/CD
**目标读者**: 新加入的开发者、贡献者、DevOps 工程师
**版本**: v1.0.0
**最后更新**: 2024-XX-XX

---

## 🚀 1. 快速开始（5 分钟上手）

### 1.1 前置依赖

| 工具        | 版本要求 | 安装命令/链接                    |
| ----------- | -------- | -------------------------------- |
| **Rust**    | 1.75+    | [rustup.rs](https://rustup.rs)   |
| **Node.js** | 20+ LTS  | [nodejs.org](https://nodejs.org) |
| **pnpm**    | 8+       | `npm install -g pnpm`            |
| **Git**     | 2.30+    | 系统自带或官网下载               |

### 1.2 一键初始化

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/r2nova.git
cd r2nova

# 2. 安装前端依赖
pnpm install

# 3. 安装 Rust 依赖（自动执行）
cargo fetch

# 4. 启动开发服务器
pnpm tauri dev
```

🎉 浏览器将自动打开桌面应用窗口！

### 1.3 验证安装

```bash
# 检查 Rust
cargo --version  # 应显示 1.75.0+
rustc --version

# 检查 Node
node --version   # 应显示 v20+
pnpm --version   # 应显示 8+

# 检查 Tauri CLI
cargo tauri --version
```

---

## 🛠 2. 开发环境详解

### 2.1 IDE 配置

#### VSCode（推荐）

**必需插件**:

- `rust-lang.rust-analyzer` - Rust 语言支持
- `serayuzgur.crates` - Cargo.toml 依赖管理
- `tamasfe.even-better-toml` - TOML 语法高亮
- `bradlc.vscode-tailwindcss` - Tailwind CSS 智能提示
- `esbenp.prettier-vscode` - 代码格式化
- `dbaeumer.vscode-eslint` - ESLint 集成

**推荐配置**（`.vscode/settings.json`）:

```json
{
  "rust-analyzer.checkOnSave.command": "clippy",
  "rust-analyzer.checkOnSave.allTargets": false,
  "rust-analyzer.cargo.targetDir": "target/ra",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  },
  "[toml]": {
    "editor.defaultFormatter": "tamasfe.even-better-toml"
  }
}
```

#### Rust 工具链配置

```bash
# 安装 clippy（静态分析）
rustup component add clippy

# 安装 rustfmt（格式化）
rustup component add rustfmt

# 安装 cargo-watch（热重载）
cargo install cargo-watch

# 安装 cargo-tarpaulin（测试覆盖率）
cargo install cargo-tarpaulin
```

### 2.2 项目结构速查

```
r2nova/
├── src/                          # 前端源码（React + TypeScript）
│   ├── components/               # UI 组件
│   ├── hooks/                    # 自定义 Hooks
│   ├── stores/                   # Zustand 状态管理
│   ├── services/                 # API/IPC 封装
│   ├── lib/                      # 工具函数
│   ├── types/                    # TypeScript 类型
│   └── pages/                    # 路由页面
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── commands/             # Tauri 命令
│   │   ├── services/             # 业务服务
│   │   ├── models/               # 数据模型
│   │   └── errors.rs             # 错误定义
│   ├── capabilities/             # Tauri 2.0 权限
│   └── Cargo.toml
├── docs/                         # 项目文档
├── public/                       # 静态资源
├── scripts/                      # 构建脚本
└── .github/workflows/            # CI/CD 配置
```

### 2.3 常用开发命令

```bash
# 开发模式（热重载）
pnpm tauri dev

# 仅前端开发（浏览器预览）
pnpm dev

# 生产构建
pnpm tauri build

# 仅构建前端
pnpm build

# Rust 检查
pnpm tauri check

# Rust 测试
cd src-tauri && cargo test

# Rust 覆盖率
cd src-tauri && cargo tarpaulin --out Html

# 格式化代码
pnpm format
cd src-tauri && cargo fmt

# 静态检查
pnpm lint
cd src-tauri && cargo clippy -- -D warnings
```

---

## 📝 3. 编码规范

### 3.1 Git 工作流

#### 分支策略

```
main                    # 生产分支，只接受 PR
├── develop             # 开发分支，日常合并
├── feature/auth        # 功能分支
├── feature/upload
├── bugfix/crash
└── hotfix/security
```

#### 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（Type）**:

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具/依赖

**作用域（Scope）**:

- `frontend`: 前端代码
- `backend`: Rust 后端
- `ui`: UI 组件
- `core`: 核心业务逻辑
- `deps`: 依赖更新
- `ci`: CI/CD 配置
- `docs`: 文档

**示例**:

```bash
# 好的提交信息
feat(backend): 实现断点续传功能
fix(frontend): 修复文件列表滚动卡顿
refactor(core): 重构 TransferManager 错误处理
perf(ui): 优化大文件列表虚拟滚动
docs: 更新 API 文档
test(backend): 添加 R2Client 单元测试
chore(deps): 升级 aws-sdk-s3 到 1.2.0

# 不好的提交信息（避免）
update
fix bug
add feature
WIP
```

### 3.2 TypeScript/React 规范

#### 文件组织

```typescript
// 1. 导入顺序：第三方 → 内部 → 类型 → 样式
import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/stores/accountStore'

import type { Account } from '@/types/account'

import './AccountCard.css'

// 2. 组件声明：使用 function 而非箭头函数
interface AccountCardProps {
  account: Account
  onSelect: (id: string) => void
}

export function AccountCard({ account, onSelect }: AccountCardProps) {
  // 3. 状态 hooks 在前
  const [isLoading, setIsLoading] = useState(false)

  // 4. 派生状态
  const displayName = account.name || account.id

  // 5. 事件处理
  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onSelect(account.id)
    } finally {
      setIsLoading(false)
    }
  }

  // 6. 渲染
  return (
    <div className="account-card">
      <span>{displayName}</span>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? '加载中...' : '切换'}
      </Button>
    </div>
  )
}
```

#### 命名规范

| 类型     | 命名方式          | 示例                                    |
| -------- | ----------------- | --------------------------------------- |
| 组件     | PascalCase        | `FileUploader`, `TransferList`          |
| Hooks    | camelCase + use   | `useR2Client`, `useTransfer`            |
| Store    | camelCase + Store | `accountStore`, `fileStore`             |
| 类型     | PascalCase        | `Account`, `TransferStatus`             |
| 工具函数 | camelCase         | `formatBytes`, `validateToken`          |
| 常量     | UPPER_SNAKE_CASE  | `MAX_UPLOAD_SIZE`                       |
| 文件     | kebab-case        | `file-uploader.tsx`, `use-r2-client.ts` |

#### 类型定义

```typescript
// types/account.ts
export interface Account {
  id: string
  name: string
  endpoint: string
  createdAt: Date
  // Token 不存储在类型中，由后端管理
}

// 避免 any，使用 unknown + 类型守卫
function processData(data: unknown): Account {
  if (!isAccount(data)) {
    throw new Error('Invalid account data')
  }
  return data
}

// 类型守卫函数
function isAccount(data: unknown): data is Account {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as Account).id === 'string'
  )
}
```

### 3.3 Rust 规范

#### 代码组织

```rust
// services/r2_client.rs

// 1. 导入：标准库 → 第三方 → 内部
use std::collections::HashMap;
use std::sync::Arc;

use aws_sdk_s3::Client;
use tokio::sync::RwLock;

use crate::errors::AppError;
use crate::models::BucketInfo;

// 2. 常量定义
const MAX_PART_SIZE: u64 = 5 * 1024 * 1024 * 1024; // 5GB
const MIN_PART_SIZE: u64 = 5 * 1024 * 1024;        // 5MB

// 3. 结构体定义
pub struct R2Client {
    client: Client,
    config: R2Config,
}

// 4. 实现块
impl R2Client {
    /// 创建新客户端
    ///
    /// # Arguments
    /// * `config` - R2 配置
    ///
    /// # Errors
    /// 当配置无效时返回 `AppError::Config`
    pub async fn new(config: R2Config) -> Result<Self, AppError> {
        let client = build_client(&config).await?;
        Ok(Self { client, config })
    }

    /// 列出所有 Buckets
    pub async fn list_buckets(&self) -> Result<Vec<BucketInfo>, AppError> {
        let resp = self.client
            .list_buckets()
            .send()
            .await
            .map_err(|e| AppError::R2Error(e.to_string()))?;

        Ok(parse_buckets(resp))
    }
}

// 5. 私有辅助函数
async fn build_client(config: &R2Config) -> Result<Client, AppError> {
    // ...
}

fn parse_buckets(resp: ListBucketsOutput) -> Vec<BucketInfo> {
    // ...
}
```

#### 错误处理

```rust
// 使用 thiserror 定义错误
#[derive(Error, Debug)]
pub enum AppError {
    #[error("R2 API 错误: {0}")]
    R2Error(String),

    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("配置错误: {0}")]
    Config(String),

    #[error("验证错误: {field}: {message}")]
    Validation { field: String, message: String },
}

// 函数返回 Result
pub async fn risky_operation() -> Result<Data, AppError> {
    let file = std::fs::read_to_string("config.json")
        .map_err(|e| AppError::Config(format!("无法读取配置: {}", e)))?;

    let data: Data = serde_json::from_str(&file)
        .map_err(|e| AppError::Config(format!("配置格式错误: {}", e)))?;

    Ok(data)
}

// 避免 unwrap/expect，使用 match 或 ?
// ❌ 错误
let result = some_operation().unwrap();

// ✅ 正确
let result = some_operation()?;
// 或
let result = some_operation().await
    .map_err(|e| AppError::R2Error(e.to_string()))?;
```

#### 异步代码规范

```rust
// 使用 tokio 运行时
#[tokio::main]
async fn main() {
    // ...
}

// 异步函数命名：动词前缀
async fn fetch_data() -> Result<Data, Error> {
    // ...
}

// 并发处理
use tokio::join;

async fn fetch_multiple() -> Result<(A, B), Error> {
    let a = fetch_a();
    let b = fetch_b();

    // 并行执行
    let (result_a, result_b) = join!(a, b);

    Ok((result_a?, result_b?))
}

// 取消机制
use tokio::select;

async fn cancellable_operation(
    mut rx: tokio::sync::mpsc::Receiver<()>
) -> Result<Data, Error> {
    select! {
        result = do_work() => result,
        _ = rx.recv() => {
            tracing::info!("操作被取消");
            Err(Error::Cancelled)
        }
    }
}
```

---

## 🧪 4. 测试策略

### 4.1 测试金字塔

```
        /\
       /  \      E2E 测试 (Playwright)
      /    \     关键用户流程
     /------\
    /        \   集成测试 (Tauri::test)
   /          \  IPC 命令、服务组合
  /------------\
 /              \ 单元测试 (cargo test)
/                \ 函数、模块隔离测试
```

### 4.2 单元测试（Rust）

```rust
// services/r2_client.rs
#[cfg(test)]
mod tests {
    use super::*;

    // 使用 mock 替代真实 R2 调用
    struct MockR2Client {
        buckets: Vec<BucketInfo>,
    }

    #[tokio::test]
    async fn test_list_buckets_success() {
        // Arrange
        let mock = MockR2Client {
            buckets: vec![
                BucketInfo { name: "test-bucket".into() },
            ],
        };

        // Act
        let result = mock.list_buckets().await;

        // Assert
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 1);
    }

    #[tokio::test]
    async fn test_list_buckets_empty() {
        let mock = MockR2Client { buckets: vec![] };

        let result = mock.list_buckets().await;

        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }
}
```

### 4.3 集成测试

```rust
// tests/integration_test.rs
use tauri::test::mock_builder;

#[test]
fn test_list_buckets_command() {
    let app = mock_builder()
        .invoke_handler(tauri::generate_handler![list_buckets])
        .build(tauri::generate_context!())
        .expect("failed to build app");

    let response = app.invoke(
        "list_buckets",
        ListBucketsRequest { account_id: "test".into() }
    );

    assert!(response.is_ok());
}
```

### 4.4 E2E 测试（Playwright）

```typescript
// e2e/upload.spec.ts
import { test, expect } from '@playwright/test'

test('用户能上传文件到 R2', async ({ page }) => {
  // 1. 打开应用
  await page.goto('tauri://localhost')

  // 2. 添加测试账号
  await page.click('[data-testid="add-account"]')
  await page.fill('[data-testid="token-input"]', 'test-token')
  await page.click('[data-testid="save-account"]')

  // 3. 选择 Bucket
  await page.click('[data-testid="bucket-test-bucket"]')

  // 4. 上传文件
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.click('[data-testid="upload-button"]')
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles('test-file.txt')

  // 5. 验证上传成功
  await expect(page.locator('[data-testid="upload-success"]')).toBeVisible()
})
```

### 4.5 测试覆盖率要求

| 模块          | 覆盖率目标 | 测量工具                       |
| ------------- | ---------- | ------------------------------ |
| Rust 业务逻辑 | > 80%      | cargo-tarpaulin                |
| IPC 命令      | 100%       | cargo test                     |
| UI 组件       | > 60%      | Vitest + React Testing Library |
| E2E 关键流程  | 100%       | Playwright                     |

```bash
# 生成覆盖率报告
cd src-tauri && cargo tarpaulin --out Html --output-dir ../coverage

# 查看报告
open coverage/tarpaulin-report.html
```

---

## 🔧 5. 调试技巧

### 5.1 Rust 调试

```bash
# 打印日志（使用 tracing）
RUST_LOG=debug pnpm tauri dev

# 特定模块日志
RUST_LOG=r2nova::services=trace pnpm tauri dev

# 使用 LLDB 调试（VSCode）
# .vscode/launch.json
{
  "type": "lldb",
  "request": "launch",
  "name": "Debug Tauri",
  "cargo": {
    "args": ["build", "--manifest-path=src-tauri/Cargo.toml"]
  },
  "args": []
}
```

### 5.2 前端调试

```typescript
// 启用 React DevTools
// 自动集成于 Tauri 开发模式

// Redux/Zustand DevTools
// stores 自动连接 Redux DevTools Extension
```

### 5.3 常见问题

| 问题             | 解决方案                              |
| ---------------- | ------------------------------------- |
| Tauri 命令无响应 | 检查 Rust panic，查看控制台           |
| 热重载失效       | 重启 `pnpm tauri dev`                 |
| Rust 编译慢      | 使用 `cargo check` 替代 `cargo build` |
| 前端端口冲突     | 修改 `vite.config.ts` 中的 port       |
| macOS 权限错误   | 在 系统设置 > 安全性与隐私 中允许     |

---

## 📦 6. 构建与发布

### 6.1 本地构建

```bash
# 开发构建（带调试信息）
pnpm tauri build --debug

# 生产构建（优化、压缩）
pnpm tauri build

# 构建产物位置
# macOS: src-tauri/target/release/bundle/dmg/*.dmg
# Windows: src-tauri/target/release/bundle/msi/*.msi
# Linux: src-tauri/target/release/bundle/deb/*.deb
```

### 6.2 CI/CD 流程

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: dtolnay/rust-action@stable

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm tauri build

      - name: Upload
        uses: actions/upload-artifact@v4
        with:
          name: r2nova-${{ matrix.platform }}
          path: src-tauri/target/release/bundle
```

### 6.3 版本管理

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/):

- `MAJOR`: 不兼容的 API 变更
- `MINOR`: 向后兼容的功能添加
- `PATCH`: 向后兼容的问题修复

```bash
# 发布流程
git checkout develop
git pull origin develop

# 更新版本号
pnpm version minor

# 合并到 main
git checkout main
git merge develop
git tag v0.2.0
git push origin main --tags
```

---

## 📚 7. 学习资源

### 7.1 新手必读

1. **Tauri 基础**: [Tauri 官方教程](https://tauri.app/v1/guides/)
2. **React 18+**: [React 新文档](https://react.dev)
3. **Rust 异步**: [Rust Async Book](https://rust-lang.github.io/async-book/)
4. **AWS S3**: [S3 API 参考](https://docs.aws.amazon.com/s3/latest/API/Welcome.html)

### 7.2 进阶阅读

- [Tauri 架构深度解析](https://tauri.app/v1/concepts/architecture/)
- [Rust 错误处理最佳实践](https://github.com/rust-lang/project-error-handling)
- [React 性能优化指南](https://react.dev/learn/thinking-in-react)

---

## 🤝 8. 贡献指南

### 8.1 提交 PR 流程

1. Fork 仓库并克隆
2. 创建功能分支: `git checkout -b feature/xxx`
3. 开发并测试
4. 确保代码规范: `pnpm lint && cargo clippy`
5. 提交信息遵循规范
6. Push 分支并创建 PR
7. 等待 Code Review

### 8.2 Code Review 检查清单

- [ ] 代码符合编码规范
- [ ] 新增功能有对应测试
- [ ] 文档已更新（如果需要）
- [ ] 无编译警告
- [ ] 无安全漏洞（依赖检查通过）

---

## 📝 更新日志

### v1.0.0 (2024-XX-XX)

- 创建开发规范文档
- 定义完整的编码规范（TypeScript/React + Rust）
- 建立测试策略和覆盖率要求
- 补充 CI/CD 流程和调试技巧

---

**相关文档**:

- 🤖 [AI Agent 指南](./AGENTS.md) - 开发总纲
- 📋 [项目规划](./PROJECT.md) - 路线图与里程碑
- 🏗 [技术架构](./ARCHITECTURE.md) - 系统设计细节

---

<p align="center">
  <em>Happy Coding! 🚀</em>
</p>
