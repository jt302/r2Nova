# ARCHITECTURE.md - 技术架构详解

**文档定位**: 系统设计、模块职责、技术实现细节
**目标读者**: 技术负责人、核心开发者、架构师
**版本**: v1.0.0
**最后更新**: 2024-XX-XX

---

## 🏗 1. 架构概览

### 1.1 架构原则

R2Nova 采用**分层架构 + 组件化设计**，遵循以下原则：

1. **关注点分离** - UI、业务逻辑、数据访问清晰分层
2. **单向数据流** - 状态变化可预测，便于调试
3. **性能优先** - Rust 处理计算密集型任务，React 专注界面渲染
4. **安全第一** - 敏感操作在后端完成，前端无权限访问密钥
5. **跨平台** - 抽象平台差异，核心业务逻辑平台无关

### 1.2 架构全景图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用户界面层                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  React 19 + TypeScript                                           │   │
│  │  ├── 组件层 (shadcn/ui + 自定义组件)                              │   │
│  │  ├── 容器层 (页面级组件)                                          │   │
│  │  └── 状态层 (Zustand + TanStack Query)                           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                              通信层                                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Tauri IPC Bridge                                                │   │
│  │  ├── Commands (invoke) - 请求/响应模式                           │   │
│  │  └── Events (emit/listen) - 实时通知                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                              业务逻辑层                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Rust Backend                                                    │   │
│  │  ├── 命令层 (Command Handlers)                                    │   │
│  │  ├── 服务层 (Business Services)                                  │   │
│  │  ├── 数据层 (Models & DTOs)                                      │   │
│  │  └── 错误层 (Error Types)                                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                              基础设施层                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │  R2/S3 Client   │  │  Transfer Mgr   │  │  Config Manager         │   │
│  │  (aws-sdk-s3)   │  │  (断点续传)      │  │  (加密存储)             │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                              外部服务                                     │
│       Cloudflare R2 (S3 API)         OS 密钥链          本地文件系统       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 技术栈验证

根据研究团队的最佳实践调研，确认以下选型：

| 组件       | 选型             | 验证来源                       | 备选方案          |
| ---------- | ---------------- | ------------------------------ | ----------------- |
| S3 客户端  | aws-sdk-s3       | AWS 官方 Rust SDK，R2 完全兼容 | rust-s3, s3       |
| 大文件传输 | Multipart Upload | AWS S3 官方协议，支持断点续传  | 自定义分片        |
| 元数据缓存 | OpenDAL (可选)   | Apache 项目，RangeReader 优化  | 自建缓存层        |
| 错误处理   | thiserror        | Rust 生态标准                  | anyhow (快速原型) |
| 异步运行时 | tokio            | Tauri 默认集成                 | async-std         |

---

## 📐 2. 分层架构详解

### 2.1 前端层（Frontend）

#### 2.1.1 职责边界

**做什么**:

- 用户界面渲染与交互
- 本地状态管理（UI 状态、临时数据）
- 服务端状态缓存（TanStack Query）
- 调用 Tauri 命令与后端通信

**不做什么**:

- 直接访问 R2 API（必须通过 Rust 后端）
- 存储敏感信息（Token、密钥）
- 处理大文件 I/O（交给后端流式处理）

#### 2.1.2 目录结构

```
src/
├── components/           # UI 组件
│   ├── ui/              # shadcn/ui 官方组件（自动生成）
│   ├── bucket/          # Bucket 相关组件
│   │   ├── BucketList.tsx
│   │   ├── BucketCard.tsx
│   │   └── BucketEmpty.tsx
│   ├── file/            # 文件操作组件
│   │   ├── FileList.tsx
│   │   ├── FileItem.tsx
│   │   ├── FilePreview.tsx
│   │   └── FileUploader.tsx
│   ├── layout/          # 布局组件
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainContent.tsx
│   └── common/          # 通用组件
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       └── ConfirmDialog.tsx
├── hooks/               # 自定义 Hooks
│   ├── useR2Client.ts   # R2 客户端封装
│   ├── useTransfer.ts   # 传输任务管理
│   ├── useConfig.ts     # 配置管理
│   └── useToast.ts      # 通知系统
├── stores/              # Zustand 状态管理
│   ├── accountStore.ts  # 账号状态
│   ├── bucketStore.ts   # Bucket 状态
│   ├── fileStore.ts     # 文件列表状态
│   └── transferStore.ts # 传输队列状态
├── services/            # API 封装
│   ├── ipcService.ts    # Tauri IPC 封装
│   ├── r2Service.ts     # R2 业务逻辑
│   └── cacheService.ts  # 本地缓存
├── lib/                 # 工具函数
│   ├── utils.ts         # 通用工具（cn, formatBytes 等）
│   ├── constants.ts     # 常量定义
│   └── validators.ts    # 验证函数
├── types/               # TypeScript 类型
│   ├── account.ts
│   ├── bucket.ts
│   ├── file.ts
│   └── transfer.ts
└── pages/               # 路由页面
    ├── Home.tsx
    ├── BucketDetail.tsx
    ├── Settings.tsx
    └── TransferManager.tsx
```

#### 2.1.3 状态管理策略

**Zustand Store 设计原则**:

```typescript
// stores/accountStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Account {
  id: string
  name: string
  endpoint: string
  // Token 不存储在 Store，只存 ID 引用
  tokenId: string
}

interface AccountState {
  accounts: Account[]
  currentAccountId: string | null
  // Actions
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>
  switchAccount: (id: string) => void
  removeAccount: (id: string) => Promise<void>
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      currentAccountId: null,

      addAccount: async account => {
        // 调用 Rust 命令保存 Token 到密钥链
        const tokenId = await invoke('save_account_token', {
          token: account.token,
        })

        set(state => ({
          accounts: [...state.accounts, { ...account, id: tokenId }],
        }))
      },

      // ...其他 actions
    }),
    {
      name: 'r2nova-accounts',
      // 只持久化非敏感数据
      partialize: state => ({
        accounts: state.accounts.map(a => ({
          ...a,
          // Token 绝不存储
          token: undefined,
        })),
        currentAccountId: state.currentAccountId,
      }),
    }
  )
)
```

**TanStack Query 使用场景**:

- Bucket 列表（`useQuery`）
- 文件列表（`useInfiniteQuery` - 虚拟滚动分页）
- 传输进度（`useMutation` + 乐观更新）

### 2.2 通信层（IPC Bridge）

#### 2.2.1 Tauri 2.0 命令定义

```rust
// src-tauri/src/commands/mod.rs
use tauri::command;
use serde::{Deserialize, Serialize};

// 所有命令参数必须可序列化、可验证
#[derive(Deserialize, Debug)]
pub struct ListBucketsRequest {
    pub account_id: String,
}

#[derive(Serialize, Debug)]
pub struct ListBucketsResponse {
    pub buckets: Vec<BucketInfo>,
}

#[command]
pub async fn list_buckets(
    request: ListBucketsRequest,
    state: tauri::State<'_, AppState>,
) -> Result<ListBucketsResponse, AppError> {
    // 参数验证
    if request.account_id.is_empty() {
        return Err(AppError::Validation("account_id is required".into()));
    }

    // 业务逻辑
    let service = state.r2_service.lock().await;
    let buckets = service.list_buckets(&request.account_id).await?;

    Ok(ListBucketsResponse { buckets })
}
```

#### 2.2.2 前端调用封装

```typescript
// services/ipcService.ts
import { invoke } from '@tauri-apps/api/core'

export const ipc = {
  // 账号管理
  async saveAccountToken(token: string): Promise<string> {
    return invoke('save_account_token', { token })
  },

  async listBuckets(accountId: string) {
    return invoke('list_buckets', { accountId })
  },

  // 文件操作
  async uploadFile(
    accountId: string,
    bucket: string,
    key: string,
    localPath: string,
    options?: { resume?: boolean }
  ) {
    return invoke('upload_file', {
      accountId,
      bucket,
      key,
      localPath,
      options,
    })
  },

  // 实时事件监听
  onTransferProgress(callback: (progress: TransferProgress) => void) {
    return listen('transfer:progress', event => {
      callback(event.payload)
    })
  },
}
```

#### 2.2.3 事件通信（实时通知）

```rust
// 后端发送事件
app.emit("transfer:progress", TransferProgress {
    transfer_id: id,
    bytes_transferred: current,
    bytes_total: total,
    speed_mbps: calculate_speed(),
});
```

### 2.3 后端层（Rust）

#### 2.3.1 模块结构

```
src-tauri/src/
├── main.rs              # 程序入口，初始化
├── lib.rs               # 库导出（用于测试）
├── app_state.rs         # 全局状态管理
├── errors.rs            # 错误类型定义
├── commands/            # Tauri 命令处理器
│   ├── mod.rs           # 命令注册
│   ├── account.rs       # 账号相关命令
│   ├── bucket.rs        # Bucket 操作命令
│   ├── file.rs          # 文件操作命令
│   └── system.rs        # 系统命令
├── services/            # 业务服务层
│   ├── mod.rs
│   ├── r2_client.rs     # R2/S3 客户端封装
│   ├── transfer_manager.rs  # 传输管理器
│   ├── config_manager.rs    # 配置管理器
│   └── cache_manager.rs     # 缓存管理器（可选）
├── models/              # 数据模型
│   ├── mod.rs
│   ├── account.rs
│   ├── bucket.rs
│   ├── file.rs
│   └── transfer.rs
└── utils/               # 工具函数
    ├── mod.rs
    ├── crypto.rs        # 加密工具
    └── fs.rs            # 文件系统工具
```

#### 2.3.2 核心服务：R2Client

基于 aws-sdk-s3 实现，支持 Cloudflare R2 的 S3 兼容 API：

```rust
// services/r2_client.rs
use aws_sdk_s3::Client;
use aws_config::BehaviorVersion;

pub struct R2Client {
    client: Client,
    endpoint: String,
}

impl R2Client {
    pub async fn new(config: &AccountConfig) -> Result<Self, AppError> {
        // 配置 R2 端点
        let endpoint_url = format!("https://{}", config.endpoint);

        let sdk_config = aws_config::defaults(BehaviorVersion::latest())
            .endpoint_url(&endpoint_url)
            .credentials_provider(Credentials::new(
                &config.access_key_id,
                &config.secret_access_key,
                None,
                None,
                "r2nova"
            ))
            .load()
            .await;

        let client = Client::new(&sdk_config);

        Ok(Self {
            client,
            endpoint: endpoint_url,
        })
    }

    /// 列出 Buckets
    pub async fn list_buckets(&self) -> Result<Vec<BucketInfo>, AppError> {
        let resp = self.client
            .list_buckets()
            .send()
            .await
            .map_err(|e| AppError::R2Error(e.to_string()))?;

        let buckets = resp.buckets()
            .iter()
            .map(|b| BucketInfo {
                name: b.name().unwrap_or("").to_string(),
                created_at: b.creation_date().map(|d| d.to_string()),
            })
            .collect();

        Ok(buckets)
    }

    /// Multipart Upload - 支持断点续传
    pub async fn create_multipart_upload(
        &self,
        bucket: &str,
        key: &str,
    ) -> Result<String, AppError> {
        let resp = self.client
            .create_multipart_upload()
            .bucket(bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| AppError::R2Error(e.to_string()))?;

        Ok(resp.upload_id().unwrap().to_string())
    }
}
```

#### 2.3.3 核心服务：TransferManager

管理上传/下载任务，支持断点续传：

```rust
// services/transfer_manager.rs
use std::collections::HashMap;
use tokio::sync::RwLock;

pub struct TransferManager {
    active_transfers: RwLock<HashMap<String, TransferTask>>,
    storage: TransferStorage, // 持久化传输状态
}

pub struct TransferTask {
    pub id: String,
    pub transfer_type: TransferType,
    pub status: TransferStatus,
    pub bucket: String,
    pub key: String,
    pub local_path: String,
    pub bytes_total: u64,
    pub bytes_transferred: u64,
    pub upload_id: Option<String>, // Multipart Upload ID
    pub completed_parts: Vec<CompletedPart>,
}

impl TransferManager {
    /// 启动上传任务，支持断点续传
    pub async fn start_upload(
        &self,
        account_id: &str,
        bucket: &str,
        key: &str,
        local_path: &str,
    ) -> Result<String, AppError> {
        // 1. 检查是否有未完成的传输
        if let Some(existing) = self.storage.load_transfer(account_id, bucket, key).await? {
            if existing.status == TransferStatus::Paused {
                // 恢复传输
                return self.resume_upload(existing.id).await;
            }
        }

        // 2. 创建新的 Multipart Upload
        let r2_client = self.get_client(account_id).await?;
        let upload_id = r2_client.create_multipart_upload(bucket, key).await?;

        // 3. 创建传输任务
        let task = TransferTask {
            id: uuid::Uuid::new_v4().to_string(),
            transfer_type: TransferType::Upload,
            status: TransferStatus::InProgress,
            bucket: bucket.to_string(),
            key: key.to_string(),
            local_path: local_path.to_string(),
            bytes_total: std::fs::metadata(local_path)?.len(),
            bytes_transferred: 0,
            upload_id: Some(upload_id),
            completed_parts: vec![],
        };

        // 4. 保存任务状态
        self.storage.save_transfer(&task).await?;

        // 5. 启动后台传输
        self.spawn_transfer_task(task.id.clone()).await?;

        Ok(task.id)
    }

    /// 分片上传实现
    async fn upload_part(
        &self,
        task: &mut TransferTask,
        part_number: i32,
        data: Vec<u8>,
    ) -> Result<CompletedPart, AppError> {
        let r2_client = self.get_client(&task.account_id).await?;

        let resp = r2_client
            .client
            .upload_part()
            .bucket(&task.bucket)
            .key(&task.key)
            .upload_id(task.upload_id.as_ref().unwrap())
            .part_number(part_number)
            .body(data.into())
            .send()
            .await?;

        Ok(CompletedPart {
            part_number,
            etag: resp.e_tag().unwrap().to_string(),
        })
    }
}
```

---

## 🔐 3. 安全架构

### 3.1 威胁模型

| 威胁             | 风险等级 | 缓解措施                      |
| ---------------- | -------- | ----------------------------- |
| API Token 泄露   | 高       | OS 密钥链存储，内存中不持久化 |
| 中间人攻击       | 中       | 强制 HTTPS，证书校验          |
| 本地文件越权访问 | 中       | Tauri 沙盒 + scoped FS        |
| XSS/注入攻击     | 低       | 严格 CSP，无 eval，输入验证   |
| 凭证暴力破解     | 低       | 无本地认证，依赖 Cloudflare   |

### 3.2 安全设计

#### 3.2.1 API Token 生命周期

```
用户输入 Token
    ↓
前端绝不存储，立即传递给后端
    ↓
Rust 后端接收
    ↓
加密后存入 OS 密钥链
    ↓
内存中仅保留解密后的引用（使用后立即清除）
    ↓
进程退出/超时时强制清除内存
```

#### 3.2.2 实现代码

```rust
// services/config_manager.rs
use keyring::Entry;
use aes_gcm::Aes256Gcm;

pub struct ConfigManager {
    keyring: Entry,
}

impl ConfigManager {
    pub fn new(service: &str, account: &str) -> Result<Self, AppError> {
        let keyring = Entry::new(service, account)?;
        Ok(Self { keyring })
    }

    /// 保存 Token 到系统密钥链
    pub fn save_token(&self, token: &str) -> Result<(), AppError> {
        self.keyring.set_password(token)?;
        Ok(())
    }

    /// 从系统密钥链读取 Token
    pub fn get_token(&self) -> Result<String, AppError> {
        let token = self.keyring.get_password()?;
        Ok(token)
    }

    /// 删除 Token
    pub fn delete_token(&self) -> Result<(), AppError> {
        self.keyring.delete_password()?;
        Ok(())
    }
}
```

### 3.3 IPC 安全

```rust
// 严格的白名单验证
#[derive(Deserialize, Debug)]
pub struct UploadRequest {
    #[validate(length(min = 1, max = 1024))]
    pub bucket: String,

    #[validate(length(min = 1, max = 1024))]
    pub key: String,

    #[validate(regex(path = "LOCAL_PATH_REGEX"))]
    pub local_path: String,
}

#[command]
pub async fn upload_file(
    request: UploadRequest,  // 自动验证
    state: tauri::State<'_, AppState>,
) -> Result<UploadResponse, AppError> {
    // request 已通过验证器校验
    // ...
}
```

---

## ⚡ 4. 性能设计

### 4.1 性能目标

| 指标             | 目标              | 测量方法                        |
| ---------------- | ----------------- | ------------------------------- |
| 冷启动时间       | < 2秒             | 生产构建，从点击图标到可操作    |
| 内存占用（空闲） | < 200MB           | Activity Monitor / Task Manager |
| 文件列表加载     | < 500ms（1000项） | 从调用到渲染                    |
| 大文件上传速度   | 达到带宽上限 90%  | 100MB 文件测试                  |
| UI 响应          | 16ms（60fps）     | React DevTools Profiler         |

### 4.2 优化策略

#### 4.2.1 大列表虚拟滚动

```typescript
// components/file/FileList.tsx
import { FixedSizeList } from 'react-window'
import { useInfiniteQuery } from '@tanstack/react-query'

export function FileList({ bucket }: { bucket: string }) {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['files', bucket],
    queryFn: ({ pageParam }) => r2Service.listFiles(bucket, { cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const allFiles = data?.pages.flatMap(page => page.files) || []

  return (
    <FixedSizeList
      height={600}
      itemCount={allFiles.length}
      itemSize={48}
      onItemsRendered={({ visibleStopIndex }) => {
        // 接近底部时加载更多
        if (visibleStopIndex > allFiles.length - 10 && hasNextPage) {
          fetchNextPage()
        }
      }}
    >
      {({ index, style }) => (
        <FileItem
          file={allFiles[index]}
          style={style}
        />
      )}
    </FixedSizeList>
  )
}
```

#### 4.2.2 传输优化

```rust
// 流式上传，避免内存中缓存大文件
pub async fn stream_upload(
    &self,
    bucket: &str,
    key: &str,
    file_path: &str,
) -> Result<(), AppError> {
    let file = tokio::fs::File::open(file_path).await?;
    let stream = tokio_util::io::ReaderStream::new(file);

    self.client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(stream.into())
        .send()
        .await?;

    Ok(())
}
```

#### 4.2.3 元数据缓存

```rust
// 可选：使用 OpenDAL 的 RangeReader 减少 API 调用
use opendal::Operator;

pub struct CachedR2Client {
    operator: Operator,
    cache: MetadataCache,
}

impl CachedR2Client {
    pub async fn list_files(&self, bucket: &str, prefix: &str) -> Result<Vec<FileInfo>, AppError> {
        // 检查缓存
        if let Some(cached) = self.cache.get(bucket, prefix).await? {
            if !cached.is_expired() {
                return Ok(cached.data);
            }
        }

        // 从 R2 获取
        let files = self.fetch_from_r2(bucket, prefix).await?;

        // 更新缓存
        self.cache.set(bucket, prefix, &files).await?;

        Ok(files)
    }
}
```

---

## 🔄 5. 数据流

### 5.1 文件上传流程

```
用户选择文件
    ↓
React: 显示选择对话框，验证文件
    ↓
调用 ipc.uploadFile()
    ↓
Tauri IPC 传输
    ↓
Rust: TransferManager.start_upload()
    ├─ 检查是否有未完成的上传（断点续传）
    ├─ 创建 Multipart Upload
    ├─ 分片读取文件
    ├─ 并行上传各分片
    └─ 上报进度事件
    ↓
Tauri Event: transfer:progress
    ↓
React: 更新传输队列 UI
    ↓
完成 / 失败通知
```

### 5.2 文件浏览流程

```
用户点击 Bucket
    ↓
React: useInfiniteQuery 触发
    ↓
TanStack Query 检查缓存
    ├─ 命中缓存 → 直接返回
    └─ 未命中 → 调用 ipc.listFiles()
    ↓
Tauri IPC 传输
    ↓
Rust: R2Client.list_objects()
    ├─ 调用 aws-sdk-s3
    ├─ 分页获取（每次 100 项）
    └─ 返回序列化数据
    ↓
React: 虚拟滚动渲染
    ↓
用户滚动 → 自动加载下一页
```

---

## 🛡 6. 错误处理

### 6.1 错误层级

```rust
// errors.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("R2 API 错误: {0}")]
    R2Error(String),

    #[error("IO 错误: {0}")]
    IoError(#[from] std::io::Error),

    #[error("验证错误: {0}")]
    Validation(String),

    #[error("配置错误: {0}")]
    Config(String),

    #[error("传输任务未找到: {0}")]
    TransferNotFound(String),

    #[error("网络错误: {0}")]
    Network(String),

    #[error("未知错误: {0}")]
    Unknown(String),
}

// 实现序列化，以便传递给前端
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

### 6.2 错误映射策略

```rust
// 从 aws-sdk-s3 错误映射到 AppError
impl From<aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::get_object::GetObjectError>> for AppError {
    fn from(err: aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::get_object::GetObjectError>) -> Self {
        match err {
            aws_sdk_s3::error::SdkError::ServiceError(e) => {
                match e.err() {
                    aws_sdk_s3::operation::get_object::GetObjectError::NoSuchKey(_) => {
                        AppError::R2Error("文件不存在".into())
                    }
                    _ => AppError::R2Error(e.to_string()),
                }
            }
            _ => AppError::Network(err.to_string()),
        }
    }
}
```

### 6.3 前端错误处理

```typescript
// 全局错误边界
export function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-container">
      <h2>出错了</h2>
      <p>{error.message}</p>
      <Button onClick={() => window.location.reload()}>重试</Button>
    </div>
  )
}

// API 错误处理
export async function safeInvoke<T>(
  command: string,
  args?: unknown
): Promise<T | AppError> {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    // 统一错误格式
    if (typeof error === 'string') {
      toast.error(error)
      return new AppError(error)
    }
    throw error
  }
}
```

---

## 📦 7. 部署与构建

### 7.1 构建流程

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

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Rust
        uses: dtolnay/rust-action@stable

      - name: Install dependencies
        run: pnpm install

      - name: Build frontend
        run: pnpm build

      - name: Build Tauri
        run: pnpm tauri build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: r2nova-${{ matrix.platform }}
          path: |
            src-tauri/target/release/bundle/**/*.dmg
            src-tauri/target/release/bundle/**/*.app
            src-tauri/target/release/bundle/**/*.exe
            src-tauri/target/release/bundle/**/*.msi
            src-tauri/target/release/bundle/**/*.deb
            src-tauri/target/release/bundle/**/*.AppImage
```

### 7.2 签名与分发

- **macOS**: Apple Developer ID 签名 + 公证
- **Windows**: EV 证书签名
- **Linux**: GPG 签名 + AppImage 更新机制

---

## 🔗 8. 参考资源

### 8.1 官方文档

- [Tauri 2.0 架构](https://v2.tauri.app/concept/architecture)
- [AWS SDK for Rust - S3](https://docs.aws.amazon.com/sdk-for-rust/latest/dg/rust_s3_code_examples.html)
- [Cloudflare R2 API](https://developers.cloudflare.com/r2/api/s3-api)
- [OpenDAL Rust Docs](https://opendal.apache.org/docs/rust)

### 8.2 参考项目

- [Cloudflare-R2-Desktop-Client](https://github.com/cced3000/Cloudflare-R2-Desktop-Client) - R2 桌面客户端
- [aws-multipart-upload](https://github.com/quasi-coherent/aws-multipart-upload) - 分片上传辅助库

---

## 📝 更新日志

### v1.0.0 (2024-XX-XX)

- 创建技术架构文档
- 定义分层架构和各层职责
- 设计 R2Client 和 TransferManager 核心模块
- 补充安全架构和性能优化策略
- 添加错误处理和数据流设计

---

**相关文档**:

- 🤖 [AI Agent 指南](./AGENTS.md) - 开发总纲
- 📋 [项目规划](./PROJECT.md) - 路线图与里程碑
- 💻 [开发规范](./DEVELOPMENT.md) - 环境搭建与编码规范

---

<p align="center">
  <em>R2Nova - 架构设计让性能与安全兼得</em>
</p>
