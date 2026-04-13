# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Send a detailed report to **security@r2nova.dev** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (optional)

You will receive an acknowledgement within 48 hours. We aim to release a patch within 14 days for confirmed critical vulnerabilities.

## Security Design

- API tokens are encrypted and stored in the OS native keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- All Tauri IPC commands use strict allowlist validation
- No remote backend — all data is processed locally
- Content Security Policy (CSP) is enforced in the WebView
