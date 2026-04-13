use serde::Serialize;
use tauri::{command, State};

use crate::commands::ApiResponse;
use crate::errors::AppError;
use crate::models::BucketInfo;
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct BucketsListResponse {
    pub buckets: Vec<BucketInfo>,
}

#[command]
pub async fn list_buckets(
    state: State<'_, AppState>,
) -> Result<ApiResponse<BucketsListResponse>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    let buckets = client.list_buckets().await?;

    Ok(ApiResponse::success(BucketsListResponse { buckets }))
}

#[command]
pub async fn get_bucket_info(
    bucket: String,
    state: State<'_, AppState>,
) -> Result<ApiResponse<BucketInfo>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    let buckets = client.list_buckets().await?;
    let bucket_info = buckets
        .into_iter()
        .find(|b| b.name == bucket)
        .ok_or_else(|| AppError::BucketNotFound(bucket))?;

    Ok(ApiResponse::success(bucket_info))
}
