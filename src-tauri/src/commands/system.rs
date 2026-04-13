use serde::Serialize;
use tauri::command;

use crate::commands::ApiResponse;
use crate::errors::AppError;
use crate::models::AppInfo;

#[allow(dead_code)]
#[derive(Debug, Serialize)]
pub struct SystemInfoResponse {
    pub app: AppInfo,
    pub platform: String,
    pub arch: String,
}

#[command]
pub async fn get_app_info() -> Result<ApiResponse<AppInfo>, AppError> {
    let info = AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        name: "R2Nova".to_string(),
        platform: std::env::consts::OS.to_string(),
    };

    Ok(ApiResponse::success(info))
}
