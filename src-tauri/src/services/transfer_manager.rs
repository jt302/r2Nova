use chrono::Utc;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter};

use crate::errors::{AppError, AppResult};
use crate::models::{TransferStatus, TransferTask, TransferType};

pub struct TransferManager {
    tasks: HashMap<String, TransferTask>,
    app_handle: AppHandle,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TransferProgressPayload {
    pub task_id: String,
    pub transfer_type: String,
    pub filename: String,
    pub bucket: String,
    pub key: String,
    pub bytes_transferred: i64,
    pub bytes_total: i64,
    pub speed_mbps: f64,
    pub status: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TransferCompletedPayload {
    pub task_id: String,
    pub bucket: String,
    pub key: String,
    pub transfer_type: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TransferFailedPayload {
    pub task_id: String,
    pub error: String,
}

impl TransferManager {
    pub async fn new(app_handle: AppHandle) -> AppResult<Self> {
        Ok(Self {
            tasks: HashMap::new(),
            app_handle,
        })
    }

    fn emit_progress(&self, task: &TransferTask) {
        let filename = task
            .key
            .split('/')
            .next_back()
            .unwrap_or(&task.key)
            .to_string();
        let payload = TransferProgressPayload {
            task_id: task.id.clone(),
            transfer_type: match task.transfer_type {
                TransferType::Upload => "upload".to_string(),
                TransferType::Download => "download".to_string(),
            },
            filename,
            bucket: task.bucket.clone(),
            key: task.key.clone(),
            bytes_transferred: task.bytes_transferred,
            bytes_total: task.bytes_total,
            speed_mbps: task.speed_mbps,
            status: match task.status {
                TransferStatus::Pending => "pending".to_string(),
                TransferStatus::InProgress => "in_progress".to_string(),
                TransferStatus::Paused => "paused".to_string(),
                TransferStatus::Completed => "completed".to_string(),
                TransferStatus::Failed => "failed".to_string(),
            },
        };

        let _ = self.app_handle.emit("transfer-progress", payload);
    }

    fn emit_completed(&self, task: &TransferTask) {
        let payload = TransferCompletedPayload {
            task_id: task.id.clone(),
            bucket: task.bucket.clone(),
            key: task.key.clone(),
            transfer_type: match task.transfer_type {
                TransferType::Upload => "upload".to_string(),
                TransferType::Download => "download".to_string(),
            },
        };
        let _ = self.app_handle.emit("transfer-completed", payload);
    }

    fn emit_failed(&self, task_id: &str, error: &str) {
        let payload = TransferFailedPayload {
            task_id: task_id.to_string(),
            error: error.to_string(),
        };
        let _ = self.app_handle.emit("transfer-failed", payload);
    }

    pub fn create_upload_task(
        &mut self,
        bucket: String,
        key: String,
        local_path: String,
        total_bytes: i64,
    ) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        let now = Utc::now();

        let task = TransferTask {
            id: id.clone(),
            transfer_type: TransferType::Upload,
            status: TransferStatus::Pending,
            bucket: bucket.clone(),
            key: key.clone(),
            local_path,
            bytes_total: total_bytes,
            bytes_transferred: 0,
            speed_mbps: 0.0,
            created_at: now,
            updated_at: now,
        };

        self.tasks.insert(id.clone(), task.clone());

        // 发射初始进度事件，让前端知道任务已创建
        self.emit_progress(&task);

        id
    }

    pub fn create_download_task(
        &mut self,
        bucket: String,
        key: String,
        local_path: String,
        total_bytes: i64,
    ) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        let now = Utc::now();

        let task = TransferTask {
            id: id.clone(),
            transfer_type: TransferType::Download,
            status: TransferStatus::Pending,
            bucket: bucket.clone(),
            key: key.clone(),
            local_path,
            bytes_total: total_bytes,
            bytes_transferred: 0,
            speed_mbps: 0.0,
            created_at: now,
            updated_at: now,
        };

        self.tasks.insert(id.clone(), task.clone());

        // 发射初始进度事件，让前端知道任务已创建
        self.emit_progress(&task);

        id
    }

    pub fn get_task(&self, id: &str) -> Option<&TransferTask> {
        self.tasks.get(id)
    }

    pub fn get_all_tasks(&self) -> Vec<&TransferTask> {
        self.tasks.values().collect()
    }

    pub fn update_progress(
        &mut self,
        id: &str,
        bytes_transferred: i64,
        speed_mbps: f64,
    ) -> AppResult<()> {
        if let Some(task) = self.tasks.get_mut(id) {
            task.bytes_transferred = bytes_transferred;
            task.speed_mbps = speed_mbps;
            task.updated_at = Utc::now();
            task.status = TransferStatus::InProgress;

            let task_clone = task.clone();
            self.emit_progress(&task_clone);

            Ok(())
        } else {
            Err(AppError::TransferNotFound(id.to_string()))
        }
    }

    pub fn complete_task(&mut self, id: &str) -> AppResult<()> {
        if let Some(task) = self.tasks.get_mut(id) {
            task.status = TransferStatus::Completed;
            task.bytes_transferred = task.bytes_total;
            task.updated_at = Utc::now();

            // 发射完成事件到前端
            let task_clone = task.clone();
            self.emit_completed(&task_clone);

            Ok(())
        } else {
            Err(AppError::TransferNotFound(id.to_string()))
        }
    }

    pub fn fail_task(&mut self, id: &str, error: String) -> AppResult<()> {
        if let Some(task) = self.tasks.get_mut(id) {
            task.status = TransferStatus::Failed;
            task.updated_at = Utc::now();

            // 发射失败事件到前端
            self.emit_failed(id, &error);

            Ok(())
        } else {
            Err(AppError::TransferNotFound(id.to_string()))
        }
    }

    pub fn pause_task(&mut self, id: &str) -> AppResult<()> {
        if let Some(task) = self.tasks.get_mut(id) {
            task.status = TransferStatus::Paused;
            task.updated_at = Utc::now();
            Ok(())
        } else {
            Err(AppError::TransferNotFound(id.to_string()))
        }
    }

    pub fn resume_task(&mut self, id: &str) -> AppResult<()> {
        if let Some(task) = self.tasks.get_mut(id) {
            task.status = TransferStatus::InProgress;
            task.updated_at = Utc::now();
            Ok(())
        } else {
            Err(AppError::TransferNotFound(id.to_string()))
        }
    }
}
