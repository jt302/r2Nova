use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod commands;
mod errors;
mod models;
mod services;

use errors::AppError;
use services::{ConfigManager, R2ClientManager, TransferManager};

pub struct AppState {
    pub config_manager: Arc<Mutex<ConfigManager>>,
    pub r2_manager: Arc<Mutex<R2ClientManager>>,
    pub transfer_manager: Arc<Mutex<TransferManager>>,
}

impl AppState {
    pub async fn new(app_handle: tauri::AppHandle) -> Result<Self, AppError> {
        let config_manager = Arc::new(Mutex::new(ConfigManager::new()?));
        let r2_manager = Arc::new(Mutex::new(R2ClientManager::new()));
        let transfer_manager = Arc::new(Mutex::new(TransferManager::new(app_handle).await?));

        Ok(Self {
            config_manager,
            r2_manager,
            transfer_manager,
        })
    }
}

#[cfg_attr(all(target_os = "android", target_os = "ios"), tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let handle_for_state = handle.clone();

            tauri::async_runtime::block_on(async move {
                let state = AppState::new(handle_for_state).await.expect("Failed to initialize app state");
                handle.manage(state);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::account::save_account,
            commands::account::list_accounts,
            commands::account::delete_account,
            commands::account::update_account,
            commands::account::set_current_account,
            commands::bucket::list_buckets,
            commands::bucket::get_bucket_info,
            commands::file::list_objects,
            commands::file::upload_file,
            commands::file::download_file,
            commands::file::delete_object,
            commands::file::delete_folder,
            commands::file::preview_folder_contents,
            commands::file::create_folder,
            commands::file::get_object_preview,
            commands::file::list_multipart_uploads,
            commands::file::abort_multipart_upload,
            commands::system::get_app_info,
            commands::theme::set_window_theme,
            commands::theme::get_system_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
