# Contributing to R2Nova

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Workflow](#workflow)
- [Commit Convention](#commit-convention)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting a PR](#submitting-a-pr)

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

## Prerequisites

| Tool       | Version  | Install                                      |
| ---------- | -------- | -------------------------------------------- |
| Rust       | 1.75+    | [rustup.rs](https://rustup.rs)               |
| Node.js    | 20+ LTS  | [nodejs.org](https://nodejs.org)             |
| pnpm       | 8+       | `npm install -g pnpm`                        |
| Tauri deps | —        | [tauri.app/start](https://tauri.app/start)   |

> On macOS, also install Xcode Command Line Tools: `xcode-select --install`

## Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_GITHUB_USERNAME/r2nova.git
cd r2nova

# 2. Install frontend dependencies
pnpm install

# 3. Start dev server (hot-reload for both frontend and Rust)
pnpm tauri dev
```

The first build compiles the Rust backend and may take a few minutes. Subsequent runs are fast.

## Project Structure

```
r2nova/
├── src/                    # React + TypeScript frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Full-page views
│   ├── services/           # Tauri IPC wrappers
│   ├── stores/             # Zustand state stores
│   └── types/              # Shared TypeScript types
├── src-tauri/
│   └── src/
│       ├── commands/       # Tauri command handlers
│       ├── services/       # Core Rust business logic
│       └── models/         # Shared Rust data models
└── docs/                   # Architecture and design docs
```

## Workflow

1. Check existing [issues](https://github.com/YOUR_GITHUB_USERNAME/r2nova/issues) before starting work
2. For significant features, open an issue to discuss the approach first
3. Fork the repo and create a branch from `main`

```bash
git checkout -b fix/upload-progress
# or
git checkout -b feat/batch-delete
```

4. Make your changes, write tests if applicable
5. Run the check suite (see [Testing](#testing))
6. Push and open a Pull Request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <short description>

[optional body]
```

| Type       | When to use                              |
| ---------- | ---------------------------------------- |
| `feat`     | New feature                              |
| `fix`      | Bug fix                                  |
| `refactor` | Code change without feature/fix          |
| `perf`     | Performance improvement                  |
| `docs`     | Documentation only                       |
| `test`     | Adding or updating tests                 |
| `chore`    | Build, CI, tooling changes               |
| `ci`       | CI/CD configuration                      |

Examples:
```
feat(upload): add drag-and-drop support
fix(transfer): prevent late progress events from resetting completed status
docs: update architecture diagram
```

## Code Style

### TypeScript / React

```bash
# Lint
pnpm lint

# Format
pnpm format

# Type-check
pnpm check
```

- Follow existing patterns for component and store structure
- Prefer named exports
- Use `cn()` from `lib/utils` for conditional Tailwind classes
- Translations go in `src/stores/i18nStore.ts`

### Rust

```bash
# Format
cargo fmt

# Lint
cargo clippy -- -D warnings

# Run tests
cargo test
```

- Follow standard Rust idioms; `clippy` is the authority
- All public functions must handle errors with `AppError` or `AppResult<T>`
- Prefer `thiserror` for error types

## Testing

```bash
# Frontend lint + type-check
pnpm check

# Rust tests
cd src-tauri && cargo test

# Full CI check (mirrors GitHub Actions)
pnpm check && cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings && cargo test
```

There is currently no end-to-end test suite. Manual testing against a real Cloudflare R2 account is required for storage-related changes.

## Submitting a PR

- Keep PRs focused — one concern per PR
- Fill in the PR template completely
- Link any related issue with `Closes #123`
- CI must pass before review
- A maintainer will review within a few business days

For questions, open a [Discussion](https://github.com/YOUR_GITHUB_USERNAME/r2nova/discussions) rather than an issue.
