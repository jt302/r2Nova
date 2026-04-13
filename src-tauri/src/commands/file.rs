use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{command, AppHandle, Emitter, State};

use crate::commands::ApiResponse;
use crate::errors::AppError;
use crate::models::ObjectInfo;

use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct UploadFileRequest {
    pub bucket: String,
    pub key: String,
    pub local_path: String,
}

#[derive(Debug, Deserialize)]
pub struct DownloadFileRequest {
    pub bucket: String,
    pub key: String,
    pub local_path: String,
}

#[derive(Debug, Deserialize)]
pub struct ListObjectsRequest {
    pub bucket: String,
    pub prefix: Option<String>,
    pub continuation_token: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ListObjectsResponse {
    pub objects: Vec<ObjectInfo>,
    pub next_token: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TransferResponse {
    pub task_id: String,
}

#[derive(Debug, Serialize)]
pub struct PreviewResponse {
    pub data: Vec<u8>,
    pub content_type: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub bucket: String,
    pub key: String,
}

#[derive(Debug, Deserialize)]
pub struct DeleteFolderRequest {
    pub bucket: String,
    pub key: String,
}

#[command]
pub async fn list_objects(
    request: ListObjectsRequest,
    state: State<'_, AppState>,
) -> Result<ApiResponse<ListObjectsResponse>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    let (objects, next_token) = client
        .list_objects(
            &request.bucket,
            request.prefix.as_deref(),
            request.continuation_token,
        )
        .await?;

    Ok(ApiResponse::success(ListObjectsResponse {
        objects,
        next_token,
    }))
}

#[command]
pub async fn upload_file(
    request: UploadFileRequest,
    state: State<'_, AppState>,
    _app_handle: AppHandle,
) -> Result<ApiResponse<TransferResponse>, AppError> {
    let path = PathBuf::from(&request.local_path);
    let metadata = tokio::fs::metadata(&path).await?;
    let total_bytes = metadata.len() as i64;

    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;
    drop(config_manager);

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    let mut transfer_manager = state.transfer_manager.lock().await;
    let task_id = transfer_manager.create_upload_task(
        request.bucket.clone(),
        request.key.clone(),
        request.local_path.clone(),
        total_bytes,
    );
    drop(transfer_manager);

    let state_for_callback = state.clone();
    let task_id_for_callback = task_id.clone();

    let result = client
        .upload_object_with_progress(
            &request.bucket,
            &request.key,
            &path,
            total_bytes,
            move |bytes_transferred, speed_mbps| {
                if let Ok(mut tm) = state_for_callback.transfer_manager.try_lock() {
                    let _ =
                        tm.update_progress(&task_id_for_callback, bytes_transferred, speed_mbps);
                }
            },
        )
        .await;

    let mut transfer_manager = state.transfer_manager.lock().await;
    match result {
        Ok(()) => {
            transfer_manager.complete_task(&task_id)?;
            Ok(ApiResponse::success(TransferResponse { task_id }))
        }
        Err(e) => {
            let error_msg = e.to_string();
            let _ = transfer_manager.fail_task(&task_id, error_msg.clone());
            Err(e)
        }
    }
}

#[command]
pub async fn download_file(
    request: DownloadFileRequest,
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<ApiResponse<TransferResponse>, AppError> {
    // Get all data we need before spawning the background task
    let (account, secret_key) = {
        let config_manager = state.config_manager.lock().await;
        let account = config_manager
            .get_active_account()
            .ok_or_else(|| AppError::Config("No active account".to_string()))?;
        let secret_key = config_manager.get_secret_key(&account.id)?;
        (account, secret_key)
    };

    // Create R2 client and get file size
    let (client, total_bytes) = {
        let mut r2_manager = state.r2_manager.lock().await;
        let client = r2_manager.get_or_create(&account, &secret_key).await?;
        let path = PathBuf::from(&request.local_path);
        let head_resp = client
            .get_object_head(&request.bucket, &request.key)
            .await?;
        let total_bytes = head_resp.content_length.unwrap_or(0);
        (path, total_bytes)
    };

    // Create transfer task
    let task_id = {
        let mut transfer_manager = state.transfer_manager.lock().await;
        let task_id = transfer_manager.create_download_task(
            request.bucket.clone(),
            request.key.clone(),
            request.local_path.clone(),
            total_bytes,
        );
        task_id
    };

    let task_id_clone = task_id.clone();
    let bucket = request.bucket.clone();
    let key = request.key.clone();
    let path = PathBuf::from(&request.local_path);
    let filename = key.split('/').last().unwrap_or(&key).to_string();

    let config_manager_arc = Arc::clone(&state.config_manager);
    let r2_manager_arc = Arc::clone(&state.r2_manager);
    let transfer_manager_arc = Arc::clone(&state.transfer_manager);

    tokio::spawn(async move {
        let result = download_in_background(
            r2_manager_arc.clone(),
            transfer_manager_arc.clone(),
            &account,
            &secret_key,
            &bucket,
            &key,
            &path,
            total_bytes,
            &task_id_clone,
            &filename,
            app_handle.clone(),
        )
        .await;

        let mut transfer_manager = transfer_manager_arc.lock().await;
        match result {
            Ok(()) => {
                let _ = transfer_manager.complete_task(&task_id_clone);
                let _ = app_handle.emit(
                    "transfer-completed",
                    serde_json::json!({
                        "task_id": task_id_clone,
                        "transfer_type": "download",
                        "bucket": bucket,
                        "key": key,
                    }),
                );
            }
            Err(e) => {
                let error_msg = e.to_string();
                let _ = transfer_manager.fail_task(&task_id_clone, error_msg.clone());
                let _ = app_handle.emit(
                    "transfer-failed",
                    serde_json::json!({
                        "task_id": task_id_clone,
                        "error": error_msg,
                    }),
                );
            }
        }
    });

    Ok(ApiResponse::success(TransferResponse { task_id }))
}

async fn download_in_background(
    r2_manager: Arc<tokio::sync::Mutex<crate::services::R2ClientManager>>,
    transfer_manager: Arc<tokio::sync::Mutex<crate::services::TransferManager>>,
    account: &crate::models::Account,
    secret_key: &str,
    bucket: &str,
    key: &str,
    path: &PathBuf,
    total_bytes: i64,
    task_id: &str,
    filename: &str,
    app_handle: AppHandle,
) -> Result<(), AppError> {
    let mut r2_manager = r2_manager.lock().await;
    let client = r2_manager.get_or_create(account, secret_key).await?;

    let task_id_clone = task_id.to_string();
    let filename_clone = filename.to_string();
    let bucket_clone = bucket.to_string();
    let key_clone = key.to_string();

    client
        .download_object_with_progress(
            bucket,
            key,
            path,
            total_bytes,
            move |bytes_transferred, speed_mbps| {
                if let Ok(mut tm) = transfer_manager.try_lock() {
                    let _ = tm.update_progress(&task_id_clone, bytes_transferred, speed_mbps);
                }
                let _ = app_handle.emit(
                    "transfer-progress",
                    serde_json::json!({
                        "task_id": task_id_clone,
                        "transfer_type": "download",
                        "filename": &filename_clone,
                        "bucket": &bucket_clone,
                        "key": &key_clone,
                        "bytes_transferred": bytes_transferred,
                        "bytes_total": total_bytes,
                        "speed_mbps": speed_mbps,
                        "status": "in_progress",
                    }),
                );
            },
        )
        .await
}

#[command]
pub async fn delete_object(
    bucket: String,
    key: String,
    state: State<'_, AppState>,
) -> Result<ApiResponse<()>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    client.delete_object(&bucket, &key).await?;

    Ok(ApiResponse::success(()))
}

#[command]
pub async fn create_folder(
    request: CreateFolderRequest,
    state: State<'_, AppState>,
) -> Result<ApiResponse<()>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    client.create_folder(&request.bucket, &request.key).await?;

    Ok(ApiResponse::success(()))
}

#[command]
pub async fn delete_folder(
    request: DeleteFolderRequest,
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<ApiResponse<()>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    let bucket = request.bucket.clone();
    let key = request.key.clone();

    let app_handle_for_progress = app_handle.clone();

    client
        .delete_folder(&request.bucket, &request.key, move |deleted, total| {
            let _ = app_handle_for_progress.emit(
                "delete-progress",
                serde_json::json!({
                    "bucket": bucket,
                    "key": key,
                    "deleted": deleted,
                    "total": total,
                }),
            );
        })
        .await?;

    Ok(ApiResponse::success(()))
}

#[derive(Debug, Deserialize)]
pub struct PreviewFolderRequest {
    pub bucket: String,
    pub key: String,
    pub limit: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct PreviewFolderResponse {
    pub objects: Vec<ObjectInfo>,
    pub has_more: bool,
    pub total_count: usize,
}

#[command]
pub async fn preview_folder_contents(
    request: PreviewFolderRequest,
    state: State<'_, AppState>,
) -> Result<ApiResponse<PreviewFolderResponse>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    let limit = request.limit.unwrap_or(100);
    let (objects, has_more) = client
        .preview_folder_contents(&request.bucket, &request.key, limit)
        .await?;
    let total_count = objects.len();

    Ok(ApiResponse::success(PreviewFolderResponse {
        objects,
        has_more,
        total_count,
    }))
}

#[command]
pub async fn get_object_preview(
    bucket: String,
    key: String,
    state: State<'_, AppState>,
) -> Result<ApiResponse<PreviewResponse>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    let data = client.get_object(&bucket, &key).await?;

    let content_type = if key.ends_with(".jpg") || key.ends_with(".jpeg") {
        "image/jpeg"
    } else if key.ends_with(".png") {
        "image/png"
    } else if key.ends_with(".gif") {
        "image/gif"
    } else if key.ends_with(".txt") || key.ends_with(".md") || key.ends_with(".json") {
        "text/plain"
    } else {
        "application/octet-stream"
    };

    Ok(ApiResponse::success(PreviewResponse {
        data: data.to_vec(),
        content_type: content_type.to_string(),
    }))
}

#[derive(Debug, Deserialize)]
pub struct ListMultipartUploadsRequest {
    pub bucket: String,
    pub prefix: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ListMultipartUploadsResponse {
    pub uploads: Vec<crate::models::MultipartUploadInfo>,
}

#[command]
pub async fn list_multipart_uploads(
    request: ListMultipartUploadsRequest,
    state: State<'_, AppState>,
) -> Result<ApiResponse<ListMultipartUploadsResponse>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    let uploads = client
        .list_multipart_uploads(&request.bucket, request.prefix.as_deref())
        .await?;

    Ok(ApiResponse::success(ListMultipartUploadsResponse {
        uploads,
    }))
}

#[derive(Debug, Deserialize)]
pub struct AbortMultipartUploadRequest {
    pub bucket: String,
    pub key: String,
    pub upload_id: String,
}

#[command]
pub async fn abort_multipart_upload(
    request: AbortMultipartUploadRequest,
    state: State<'_, AppState>,
) -> Result<ApiResponse<()>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let account = config_manager
        .get_active_account()
        .ok_or_else(|| AppError::Config("No active account".to_string()))?;

    let secret_key = config_manager.get_secret_key(&account.id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    let client = r2_manager.get_or_create(&account, &secret_key).await?;

    client
        .abort_multipart_upload(&request.bucket, &request.key, &request.upload_id)
        .await?;

    Ok(ApiResponse::success(()))
}
