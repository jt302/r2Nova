use tauri::{command, State};
use serde::{Deserialize, Serialize};
use tracing::{info, error};

use crate::commands::ApiResponse;
use crate::errors::AppError;
use crate::models::{Account, AccountInput};
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct SaveAccountRequest {
    pub name: String,
    pub endpoint: String,
    pub access_key_id: String,
    pub secret_access_key: String,
}

#[derive(Debug, Serialize)]
pub struct AccountResponse {
    pub account: Account,
}

#[derive(Debug, Serialize)]
pub struct AccountsListResponse {
    pub accounts: Vec<Account>,
    pub active_account_id: Option<String>,
}

#[command]
pub async fn save_account(
    request: SaveAccountRequest,
    state: State<'_, AppState>,
) -> Result<ApiResponse<AccountResponse>, AppError> {
    info!("Received save_account request for: {}", request.name);
    
    let input = AccountInput {
        name: request.name,
        endpoint: request.endpoint,
        access_key_id: request.access_key_id,
        secret_access_key: request.secret_access_key,
    };

    let mut config_manager = state.config_manager.lock().await;
    
    match config_manager.save_account(input) {
        Ok(account) => {
            info!("Account saved successfully: {} (ID: {})", account.name, account.id);
            Ok(ApiResponse::success(AccountResponse { account }))
        }
        Err(e) => {
            error!("Failed to save account: {:?}", e);
            Err(e)
        }
    }
}

#[command]
pub async fn list_accounts(
    state: State<'_, AppState>,
) -> Result<ApiResponse<AccountsListResponse>, AppError> {
    let config_manager = state.config_manager.lock().await;
    let accounts = config_manager.list_accounts();
    let active_account_id = config_manager.get_active_account().map(|a| a.id);

    Ok(ApiResponse::success(AccountsListResponse {
        accounts,
        active_account_id,
    }))
}

#[command]
pub async fn delete_account(
    id: String,
    state: State<'_, AppState>,
) -> Result<ApiResponse<()>, AppError> {
    let mut config_manager = state.config_manager.lock().await;
    config_manager.delete_account(&id)?;

    let mut r2_manager = state.r2_manager.lock().await;
    r2_manager.remove(&id);

    Ok(ApiResponse::success(()))
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccountRequest {
    pub id: String,
    pub name: String,
    pub endpoint: String,
    pub access_key_id: String,
    pub secret_access_key: String,
}

#[command]
pub async fn update_account(
    request: UpdateAccountRequest,
    state: State<'_, AppState>,
) -> Result<ApiResponse<AccountResponse>, AppError> {
    info!("Received update_account request for: {} (ID: {})", request.name, request.id);
    
    let input = AccountInput {
        name: request.name,
        endpoint: request.endpoint,
        access_key_id: request.access_key_id,
        secret_access_key: request.secret_access_key,
    };

    let mut config_manager = state.config_manager.lock().await;
    
    match config_manager.update_account(&request.id, input) {
        Ok(account) => {
            info!("Account updated successfully: {} (ID: {})", account.name, account.id);
            Ok(ApiResponse::success(AccountResponse { account }))
        }
        Err(e) => {
            error!("Failed to update account: {:?}", e);
            Err(e)
        }
    }
}

#[command]
pub async fn set_current_account(
    id: String,
    state: State<'_, AppState>,
) -> Result<ApiResponse<()>, AppError> {
    info!("Received set_current_account request for: {}", id);
    
    let mut config_manager = state.config_manager.lock().await;
    
    match config_manager.set_active_account(Some(&id)) {
        Ok(_) => {
            info!("Current account set successfully: {}", id);
            Ok(ApiResponse::success(()))
        }
        Err(e) => {
            error!("Failed to set current account: {:?}", e);
            Err(e)
        }
    }
}
