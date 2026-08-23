# D10 — Linux 三种包由 Ubuntu 22.04 一条流水线产出

- 状态：已采纳
- 日期：2026-08-23

## 决策

Linux 发布物在 **ubuntu-22.04** runner 上一次打出 `.deb`、`.rpm`、AppImage。不设 Fedora 构建机，不做 aarch64。

应用内更新：`latest.json` 的 `linux-x86_64` 指向 AppImage。`.deb` / `.rpm` 安装探测到非 AppImage 后，关于页只打开 GitHub Releases，不调用 `downloadAndInstall`。

## 理由

glibc 只向前兼容。22.04（2.35）的二进制能跑在 Ubuntu 24.04 和 Fedora 38+；在 24.04 上构建会把 22.04 用户卡在 `GLIBC_2.38 not found`。

Tauri bundler 在 Debian 系上也能写出 Fedora 依赖名的 RPM。WebKitGTK 4.1 是硬下限（Ubuntu 22.04+ 的 `libwebkit2gtk-4.1-0`，Fedora 的 `webkit2gtk4.1`）。

`latest.json` 每平台一个 URL。若把 AppImage 字节喂给 deb 安装器会失败，所以按 `APPIMAGE` 环境变量分流，不为 deb/rpm 自造第二套更新协议。
