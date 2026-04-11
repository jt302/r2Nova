# R2Nova - Cloudflare R2 桌面客户端

<p align="center">
  <img src="./public/logo.png" alt="R2Nova Logo" width="120">
</p>

<p align="center">
  <strong>像操作本地文件一样管理 Cloudflare R2 对象存储</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#下载">下载</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#贡献">贡献</a> •
  <a href="#许可证">许可证</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Rust-1.75+-DEA584?logo=rust" alt="Rust">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

---

## 📖 简介

**R2Nova（星际 R2）** 是一款专为 Cloudflare R2 对象存储打造的现代化桌面客户端。我们致力于为中国开发者和团队提供极致简洁、高性能的文件管理体验。

### 核心定位

> 「**Cloudflare R2 的 Finder**」—— 让云端存储像本地文件夹一样直观易用

### 为什么选择 R2Nova？

| 特性       | R2Nova             | 其他 R2 工具 |
| ---------- | ------------------ | ------------ |
| 安装包体积 | ~5MB               | 50MB+        |
| 启动速度   | < 2秒              | 3-5秒        |
| 大文件支持 | 50GB+ 断点续传     | 通常限制 5GB |
| 界面语言   | 原生中文 + English | 多为英文     |
| 账号管理   | 多账号无缝切换     | 单账号       |
| 离线能力   | 完整本地运行       | 依赖云服务   |

---

## ✨ 功能特性

### 已支持

- [x] **多账号管理** - API Token 安全存储，快速切换多个 R2 账号
- [x] **Bucket 浏览** - 类 Finder 的文件树展示，支持分页加载
- [x] **基础文件操作** - 上传、下载、删除、重命名
- [x] **文件预览** - 图片、视频、PDF、文本文件内置预览
- [x] **暗黑模式** - 跟随系统或手动切换
- [x] **国际化** - 简体中文 / English

### 开发中

- [ ] **断点续传** - 大文件上传/下载自动恢复
- [ ] **批量操作** - 多文件选择、批量上传/下载
- [ ] **传输队列** - 可视化传输进度管理
- [ ] **自定义域名** - 一键生成分享链接
- [ ] **文件搜索** - Bucket 内文件全文检索

### 规划中

- [ ] **Cloudflare Images 集成** - 图片自动优化
- [ ] **Workers 快捷部署** - 边缘函数一键发布
- [ ] **版本控制** - 文件历史版本管理
- [ ] **团队协作** - 共享配置、权限管理

---

## 🚀 快速开始

### 环境要求

- **Rust** 1.75+（[安装指南](https://rustup.rs/)）
- **Node.js** 20+ LTS（[下载](https://nodejs.org/)）
- **Tauri CLI**（自动安装）

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/r2nova.git
cd r2nova

# 2. 安装前端依赖
pnpm install

# 3. 安装 Rust 依赖
cargo fetch

# 4. 启动开发服务器
pnpm tauri dev
```

### 获取 Cloudflare R2 API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **R2** > **Manage R2 API Tokens**
3. 创建新 Token，权限选择：**Object Read & Write**
4. 复制 Token 到 R2Nova 的账号设置中

---

## 📥 下载

### 正式版本

| 平台    | 下载                                                                     | 说明                       |
| ------- | ------------------------------------------------------------------------ | -------------------------- |
| macOS   | [R2Nova-macOS.dmg](https://github.com/yourusername/r2nova/releases)      | Intel & Apple Silicon 通用 |
| Windows | [R2Nova-Windows.exe](https://github.com/yourusername/r2nova/releases)    | 64-bit 安装包              |
| Linux   | [R2Nova-Linux.AppImage](https://github.com/yourusername/r2nova/releases) | 免安装版本                 |
| Linux   | [R2Nova-Linux.deb](https://github.com/yourusername/r2nova/releases)      | Debian/Ubuntu 包           |

### 开发版本

每夜构建版本包含最新功能，但可能不稳定：

- [Nightly Builds](https://github.com/yourusername/r2nova/actions)

---

## 🛠 技术栈

| 层级          | 技术                                                                                   | 说明                     |
| ------------- | -------------------------------------------------------------------------------------- | ------------------------ |
| **桌面框架**  | [Tauri 2.0](https://tauri.app) + Rust                                                  | 高性能、小体积、原生体验 |
| **前端**      | [React 19](https://react.dev) + [TypeScript](https://typescriptlang.org)               | 现代、类型安全           |
| **UI 组件**   | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)           | 极简、可定制             |
| **状态管理**  | [Zustand](https://zustand-demo.pmnd.rs) + [TanStack Query](https://tanstack.com/query) | 轻量、高效               |
| **S3 客户端** | [aws-sdk-s3](https://github.com/awslabs/aws-sdk-rust) (Rust)                           | 官方兼容 R2              |
| **构建**      | [Tauri CLI](https://tauri.app/v1/api/cli) + GitHub Actions                             | 自动化发布               |

---

## 📚 文档

- [📋 项目规划](./docs/PROJECT.md) - 愿景、路线图、里程碑
- [🏗 技术架构](./docs/ARCHITECTURE.md) - 系统设计、模块职责
- [💻 开发规范](./docs/DEVELOPMENT.md) - 环境搭建、编码规范、测试
- [🤖 AI Agent 指南](./AGENTS.md) - 给 AI 助手看的开发总纲

---

## 🤝 贡献

我们欢迎所有形式的贡献！

### 贡献方式

1. **提交 Issue** - 报告 Bug 或提出功能建议
2. **提交 PR** - 修复问题或实现新功能
3. **改进文档** - 完善中英文文档
4. **分享推广** - 推荐给需要的朋友

### 开发流程

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

```bash
# 1. Fork 并克隆
git clone https://github.com/yourusername/r2nova.git

# 2. 创建分支
git checkout -b feature/your-feature

# 3. 提交更改
git commit -m "feat: add your feature"

# 4. 推送并创建 PR
git push origin feature/your-feature
```

---

## 🔒 安全

- API Token 使用 OS 原生密钥链加密存储
- 所有 IPC 通信经过严格白名单验证
- 无后端服务器，数据完全本地处理
- 开源代码，可审计

发现安全漏洞？请发送邮件至 security@r2nova.dev（不要公开提交 Issue）

---

## 📄 许可证

R2Nova 采用 [MIT 许可证](./LICENSE) 开源。

```
MIT License

Copyright (c) 2024 R2Nova Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🙏 致谢

- [Tauri](https://tauri.app) - 出色的桌面应用框架
- [shadcn/ui](https://ui.shadcn.com) - 精美的 UI 组件
- [Cloudflare](https://cloudflare.com) - 提供卓越的 R2 对象存储服务
- [所有贡献者](./CONTRIBUTORS.md) - 让这个项目成为可能

---

<p align="center">
  Made with ❤️ by R2Nova Team
</p>

<p align="center">
  <a href="https://github.com/yourusername/r2nova">GitHub</a> •
  <a href="https://r2nova.dev">官网</a> •
  <a href="https://twitter.com/r2nova">Twitter</a>
</p>
