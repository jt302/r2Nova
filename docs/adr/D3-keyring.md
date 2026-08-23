# D3 — 凭据存储：keyring-core 4.x 架构

- 状态：已采纳
- 日期：2026-08-18
- 修订：2026-08-23（Linux Secret Service）

## 决策

不用 Stronghold。用 `keyring-core` 1.x + 平台 store：

- macOS：`apple-native-keyring-store`（钥匙串）
- Windows：`windows-native-keyring-store`（Credential Manager）
- Linux：`dbus-secret-service-keyring-store`（Secret Service / D-Bus，`crypto-rust`）

MSRV ≥ 1.88，工具链锁在 1.94.1。测试用 `keyring_core::mock::Store`。生产路径禁止 fallback 到 mock。

## 理由

`iota_stronghold` 停更且强制主密码。`keyring` 4.x docs.rs 明确说应用不应直接链接 `keyring`，应链 core + 平台 store。

Linux 桌面会话若没有 Secret Service（GNOME Keyring / KWallet / KeePassXC），存密钥失败并返回 `kind: keyring`，不静默降级。AppImage 走宿主 session bus，不自带密钥环。

隐藏坑：macOS 钥匙串 ACL 绑定代码签名；未签名 dev 与已签名 release 是不同应用。
