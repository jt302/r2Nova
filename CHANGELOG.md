# Changelog

All notable changes to R2Nova will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-04-13

### Added

- Multi-account management with OS keychain encryption
- Bucket browser with folder navigation and breadcrumb
- File upload with real-time progress tracking
- Async file download with background transfer queue
- Folder creation and deletion (including non-empty folders)
- Multipart upload support and in-progress upload listing
- Transfer Center page for monitoring active transfers
- Dark / light / system theme support
- Internationalization: Simplified Chinese and English
- Rust backend via Tauri 2.0 with S3-compatible R2 API
- GitHub Actions CI (lint, type-check, cargo fmt/clippy) and release workflows

### Fixed

- Upload progress showing 0% due to duplicate task registration
- Full file list refresh triggering on every upload completion
- Late `transfer-progress` events resetting completed task status
- Download blocking the UI thread
