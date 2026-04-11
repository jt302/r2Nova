# AGENTS.md - AI Agent 开发总纲

**本文档面向**: AI 助手 / Claude / 自动化开发工具
**文档定位**: 开发决策参考、上下文传递、知识沉淀
**版本**: v1.0.0
**最后更新**: 2024-XX-XX

---

## 🎯 文档目的

AGENTS.md 是 R2Nova 项目的「**AI 上下文锚点**」。当 AI 助手参与开发时，首先阅读本文档以获取：

1. **项目全局上下文** - 愿景、约束、边界
2. **技术决策依据** - 为什么选这些技术？
3. **开发规范** - 代码风格、目录约定、提交规范
4. **快速导航** - 其他文档的入口

---

## 🚀 项目速览

| 属性         | 值                                         |
| ------------ | ------------------------------------------ |
| **名称**     | R2Nova（星际 R2）                          |
| **定位**     | Cloudflare R2 专业桌面客户端               |
| **slogan**   | 「像本地文件管理器一样操作云端对象存储」   |
| **目标用户** | 中国开发者、中小型团队、追求极致体验的用户 |
| **当前阶段** | 规划 & 脚手架                              |
| **里程碑**   | v0.1.0-alpha（基础文件浏览）               |

### 核心差异化

1. **极致简洁** - 类 Finder 的直观界面，无学习成本
2. **性能优先** - Tauri 驱动，启动 < 2秒，内存 < 200MB
3. **大文件专家** - 50GB+ 断点续传，批量智能操作
4. **本土化** - 原生中文支持，针对国内网络优化
5. **零后端** - 完全本地化运行，数据隐私有保障

---

## 📚 文档地图

```
docs/
├── AGENTS.md          ← 你在这里（AI 开发总纲）
├── PROJECT.md         → 项目规划、路线图、里程碑
├── ARCHITECTURE.md    → 技术架构、系统设计、模块职责
└── DEVELOPMENT.md     → 开发环境、编码规范、测试策略
```

**阅读顺序建议**:

1. 第一次接触 → 读 `PROJECT.md` 了解全貌
2. 开始开发 → 读 `DEVELOPMENT.md` 配置环境
3. 设计功能 → 读 `ARCHITECTURE.md` 理解系统
4. AI 助手 → 精读本文档（AGENTS.md）

---

## 🏗 架构速查

### 技术栈（已冻结）

| 层级      | 技术                       | 状态      | 变更需审批 |
| --------- | -------------------------- | --------- | ---------- |
| 桌面框架  | Tauri 2.0 + Rust           | ✅ 已确定 | 是         |
| 前端      | React 19 + TypeScript      | ✅ 已确定 | 是         |
| UI 组件   | shadcn/ui + Tailwind CSS   | ✅ 已确定 | 否         |
| 状态管理  | Zustand + TanStack Query   | ✅ 已确定 | 否         |
| S3 客户端 | aws-sdk-s3 (Rust)          | ✅ 已确定 | 是         |
| 构建      | Tauri CLI + GitHub Actions | ✅ 已确定 | 否         |

### 禁止使用的技术（硬性约束）

- ❌ **Electron** - 体积过大（>100MB），违背性能目标
- ❌ **Next.js** - 不需要 SSR，增加复杂度
- ❌ **任何 Node.js 后端** - 必须完全本地化运行
- ❌ ** Redux ** - 样板代码过多，Zustand 足够
- ❌ **Plain CSS/Sass** - 统一使用 Tailwind CSS

### 核心模块

```
Frontend (React)
├── components/        # UI 组件（shadcn/ui 为主）
├── hooks/              # 业务逻辑 Hooks
├── stores/             # Zustand 状态管理
└── services/           # API 封装

Tauri Bridge
├── commands/           # IPC 命令定义
└── events/             # 事件通信

Backend (Rust)
├── commands/           # 命令处理器
├── services/           # 业务服务层
│   ├── r2_client.rs    # S3/R2 客户端
│   ├── transfer_manager.rs  # 断点续传
│   └── config_manager.rs    # 加密配置
├── models/             # 数据模型
└── errors.rs           # 错误定义
```

---

## 🌐 国际化开发指南（i18n）

### 架构概览

项目使用 **自定义 Zustand Store** 实现国际化，而非 i18next：

```
src/stores/i18nStore.ts          # 翻译字典和状态管理
src/components/LanguageSettings.tsx  # 语言切换 UI
```

### 支持语言

| 语言代码 | 语言     | 国旗 |
| -------- | -------- | ---- |
| `zh-CN`  | 简体中文 | 🇨🇳   |
| `en`     | English  | 🇬🇧   |

### 开发规范

**1. 所有用户可见文本必须可翻译**

```typescript
// ✅ 正确 - 使用翻译函数
import { useTranslation } from '~/stores/i18nStore'

function MyComponent() {
  const { t } = useTranslation()
  return <button>{t('button.save')}</button>
}

// ❌ 错误 - 硬编码中文
<button>保存</button>

// ❌ 错误 - 硬编码英文
<button>Save</button>
```

**2. 翻译键命名规范**

格式：`<模块>.<功能>.<元素>`

```typescript
// 页面级别
'page.bucket.title' // 页面标题
'page.bucket.emptyMessage' // 空状态提示

// 组件级别
'component.upload.button' // 按钮文本
'component.upload.dragText' // 拖拽提示

// 通用级别
'common.save' // 通用操作
'common.cancel'
'common.deleteConfirm' // 带变量的翻译
```

**3. 添加新翻译**

在 `src/stores/i18nStore.ts` 中添加双语翻译：

```typescript
const translations: Record<Language, Record<string, string>> = {
  'zh-CN': {
    // ... 现有翻译
    'feature.newKey': '新的中文文本',
    'feature.withVariable': '你好，{name}！', // 支持变量
  },
  en: {
    // ... 现有翻译
    'feature.newKey': 'New English Text',
    'feature.withVariable': 'Hello, {name}!',
  },
}
```

**4. 使用变量插值**

```typescript
// 翻译键：'file.deleteConfirm': '确定要删除 {filename} 吗？'

const message = t('file.deleteConfirm').replace('{filename}', fileName)
// 结果："确定要删除 document.pdf 吗？"
```

### 语言切换实现

```typescript
import { useTranslation } from '~/stores/i18nStore'

function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation()

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
    >
      <option value="zh-CN">{t('settings.languageZh')}</option>
      <option value="en">{t('settings.languageEn')}</option>
    </select>
  )
}
```

### 添加新语言步骤

1. **在 `i18nStore.ts` 添加语言类型**

   ```typescript
   export type Language = 'zh-CN' | 'en' | 'ja' // 新增 'ja'
   ```

2. **添加完整翻译字典**

   ```typescript
   const translations: Record<Language, Record<string, string>> = {
     'zh-CN': {
       /* ... */
     },
     en: {
       /* ... */
     },
     ja: {
       'app.title': 'R2Nova',
       'app.noAccount': 'アカウントが選択されていません',
       // ... 完整翻译
     },
   }
   ```

3. **更新 LanguageSettings.tsx**
   ```typescript
   const languages = [
     { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
     { value: 'en', label: 'English', flag: '🇬🇧' },
     { value: 'ja', label: '日本語', flag: '🇯🇵' }, // 新增
   ]
   ```

### 禁止事项

- ❌ **不要**使用浏览器原生的 `prompt()` 或 `alert()`（无法翻译且 UX 差）
- ❌ **不要**在代码中硬编码任何语言文本
- ❌ **不要**添加翻译键后只填充一种语言
- ❌ **不要**使用复杂嵌套对象结构（保持扁平化键名）

### 质量检查清单

添加/修改功能时验证：

- [ ] 所有新增文本都有对应翻译键
- [ ] 中文和英文翻译都已添加
- [ ] 变量插值正确使用 `{var}` 格式
- [ ] 语言切换后文本正确更新

---

## 💻 开发上下文

### 目录约定

```bash
r2nova/
├── src/                    # 前端源码
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── services/
│   ├── lib/               # 工具函数
│   ├── types/             # TS 类型定义
│   └── pages/             # 路由页面
├── src-tauri/             # Rust 后端
│   ├── src/
│   │   ├── commands/      # Tauri 命令
│   │   ├── services/      # 业务服务
│   │   ├── models/        # 数据模型
│   │   ├── errors.rs      # 错误类型
│   │   └── utils.rs       # 工具函数
│   ├── capabilities/      # Tauri 2.0 权限
│   └── Cargo.toml
├── docs/                  # 项目文档
├── public/                # 静态资源
├── scripts/               # 构建脚本
└── .github/               # CI/CD 配置
```

### 命名规范

- **文件**: kebab-case（`file-uploader.tsx`）
- **组件**: PascalCase（`FileUploader`）
- **Hooks**: camelCase + use 前缀（`useR2Client`）
- **Rust 模块**: snake_case（`r2_client.rs`）
- **Rust 类型**: PascalCase（`R2Client`）
- **常量**: UPPER_SNAKE_CASE（`MAX_UPLOAD_SIZE`）

### 代码风格（强制执行）

**TypeScript/React**:

- 使用 `function` 声明组件，而非箭头函数
- Props 类型必须显式命名（`interface ButtonProps`）
- 严格模式开启，禁止 `any` 类型
- 使用 `~/` 路径别名引用 src/ 内模块

**Rust**:

- 使用 `thiserror` 定义错误类型
- 异步函数返回 `Result<T, AppError>`
- 公共 API 必须有文档注释（`///`）
- 使用 `clippy` 检查，零警告通过

### 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>

<body>
```

**Types**:

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具

**Scopes**: `frontend`, `backend`, `ui`, `core`, `docs`, `ci`

---

## 🔒 安全红线（不可触碰）

### 1. API Token 安全

- ✅ **正确**: 使用 Tauri `stronghold` 或 OS 密钥链存储
- ❌ **错误**: 存储在 localStorage、IndexedDB、或明文文件

### 2. IPC 安全

- ✅ **正确**: 所有命令参数使用结构体 + 验证
- ❌ **错误**: 直接传递字符串、使用 eval、拼接命令

### 3. 文件系统安全

- ✅ **正确**: 使用 Tauri 的 scoped FS API，限制访问目录
- ❌ **错误**: 直接调用系统命令操作文件

### 4. 网络安全

- ✅ **正确**: 仅允许访问 R2/S3 域名，CSP 策略严格
- ❌ **错误**: 允许任意域名、禁用 CSP

---

## 🧪 质量标准

### 测试要求

- **Rust 业务逻辑**: 覆盖率 > 80%
- **IPC 命令**: 每个命令至少 1 个集成测试
- **关键流程**: E2E 覆盖（上传/下载/删除）
- **UI 组件**: 关键组件有 Storybook

### 性能基线

| 指标             | 目标         | 测试方法         |
| ---------------- | ------------ | ---------------- |
| 冷启动时间       | < 2秒        | 生产构建计时     |
| 内存占用（空闲） | < 200MB      | Activity Monitor |
| 文件列表滚动     | 1000 项流畅  | 性能面板         |
| 大文件上传       | 50GB+ 无崩溃 | 实际测试         |

### 代码审查清单

- [ ] 无 `any` 类型，无 `@ts-ignore`
- [ ] 错误处理完整，无空 catch
- [ ] 异步操作有取消机制
- [ ] 敏感信息未硬编码
- [ ] 日志无敏感数据泄露
- [ ] 文档注释完整

---

## 🎯 决策原则

当 AI 助手面临选择时，遵循以下优先级：

1. **性能 > 便利** - 宁可多写代码，也要保证轻量快速
2. **安全 > 功能** - 功能可以晚做，安全不能妥协
3. **简单 > 灵活** - 减少配置项， Convention over Configuration
4. **本地 > 云端** - 优先本地处理，减少对云服务依赖
5. **中文 > 英文** - 界面优先中文，代码优先英文

### 常见决策参考

| 场景        | 推荐方案                    | 避免方案          |
| ----------- | --------------------------- | ----------------- |
| 状态管理    | Zustand                     | Redux、MobX       |
| HTTP 客户端 | 原生 fetch + TanStack Query | Axios             |
| 表单处理    | React Hook Form + Zod       | Formik、自建验证  |
| 日期处理    | date-fns                    | moment.js         |
| 图标        | Lucide React                | FontAwesome、自建 |
| 通知        | Sonner (shadcn)             | 自建通知系统      |

---

## 🚨 已知陷阱（AI 必读）

### 1. Tauri 2.0 迁移陷阱

- 权限系统从 `tauri.conf.json` 迁移到 `capabilities/` 目录
- IPC 命令定义方式变更，需检查兼容性

### 2. React 19 特性

- Server Actions 不适用（无 SSR）
- 新的 Hook 行为，注意 useEffect 清理时机

### 3. Rust 异步陷阱

- `tokio` 运行时配置需匹配 Tauri
- 避免在 UI 线程阻塞

### 4. S3 客户端陷阱

- R2 不完全等于 S3，某些 API 行为有差异
- Multipart upload 的 Part 大小限制（5MB - 5GB）
- ETag 可能不是 MD5，不能依赖验证文件完整性

### 5. 跨平台陷阱

- 路径分隔符：`std::path::PathBuf` 自动处理
- 文件系统权限：macOS 需申请沙盒权限
- 窗口行为：Linux 上某些特性不支持

---

## 📞 求助与资源

### 官方资源

- [Tauri 2.0 文档](https://v2.tauri.app)
- [shadcn/ui 组件](https://ui.shadcn.com)
- [AWS SDK for Rust](https://docs.rs/aws-sdk-s3)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2)

### 项目资源

- 问题追踪: [GitHub Issues](https://github.com/yourusername/r2nova/issues)
- 路线图: [GitHub Projects](https://github.com/yourusername/r2nova/projects)
- 讨论区: [GitHub Discussions](https://github.com/yourusername/r2nova/discussions)

### 快速链接

- 📋 [项目规划](./PROJECT.md)
- 🏗 [技术架构](./ARCHITECTURE.md)
- 💻 [开发规范](./DEVELOPMENT.md)

---

## 📝 更新日志

### v1.0.0 (2024-XX-XX)

- 重构文档结构，拆分为 4 个独立文档
- 明确 AI Agent 的决策原则和安全红线
- 补充已知陷阱和常见决策参考
- 更新技术栈状态（Tauri 2.0、React 19）

---

**下一步阅读建议**:

- 如果你要**了解项目全貌** → 阅读 [PROJECT.md](./PROJECT.md)
- 如果你要**开始编码** → 阅读 [DEVELOPMENT.md](./DEVELOPMENT.md)
- 如果你要**设计新功能** → 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md)

---

<p align="center">
  <em>Happy Coding with R2Nova! 🚀</em>
</p>
