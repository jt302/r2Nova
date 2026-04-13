use keyring::Entry;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tracing::{debug, error, info, warn};

use crate::errors::{AppError, AppResult};
use crate::models::{Account, AccountInput};

const SERVICE_NAME: &str = "com.r2nova.app";
const ACCOUNTS_INDEX_KEY: &str = "__accounts_index__";

pub struct ConfigManager {
    accounts_cache: HashMap<String, Account>,
    storage_path: PathBuf,
    use_file_storage: bool,
}

impl ConfigManager {
    pub fn new() -> AppResult<Self> {
        info!("Initializing ConfigManager...");

        let storage_path = Self::get_storage_path()?;
        info!("Storage path: {:?}", storage_path);

        let mut manager = Self {
            accounts_cache: HashMap::new(),
            storage_path,
            use_file_storage: false,
        };

        match manager.load_accounts_from_keyring() {
            Ok(_) => {
                info!(
                    "Successfully loaded {} accounts from keyring",
                    manager.accounts_cache.len()
                );
            }
            Err(e) => {
                warn!(
                    "Failed to load accounts from keyring ({}). Falling back to file storage.",
                    e
                );
                manager.use_file_storage = true;
                match manager.load_accounts_from_file() {
                    Ok(_) => {
                        info!(
                            "Successfully loaded {} accounts from file",
                            manager.accounts_cache.len()
                        );
                    }
                    Err(e) => {
                        warn!(
                            "Failed to load accounts from file: {}. Starting with empty cache.",
                            e
                        );
                    }
                }
            }
        }

        Ok(manager)
    }

    fn get_storage_path() -> AppResult<PathBuf> {
        let home_dir = dirs::home_dir()
            .ok_or_else(|| AppError::Config("Failed to get home directory".to_string()))?;
        let storage_dir = home_dir.join(".r2nova");

        if !storage_dir.exists() {
            fs::create_dir_all(&storage_dir).map_err(AppError::Io)?;
        }

        Ok(storage_dir.join("accounts.json"))
    }

    fn load_accounts_from_file(&mut self) -> AppResult<()> {
        debug!("Loading accounts from file...");

        if !self.storage_path.exists() {
            debug!("Storage file does not exist yet");
            return Ok(());
        }

        let content = fs::read_to_string(&self.storage_path).map_err(AppError::Io)?;

        let data: serde_json::Value =
            serde_json::from_str(&content).map_err(AppError::Serialization)?;

        if let Some(accounts) = data["accounts"].as_array() {
            // 获取保存的活跃账号ID
            let active_account_id = data["active_account_id"].as_str();

            for account_data in accounts {
                if let (Some(id), Some(name), Some(endpoint), Some(access_key_id)) = (
                    account_data["id"].as_str(),
                    account_data["name"].as_str(),
                    account_data["endpoint"].as_str(),
                    account_data["access_key_id"].as_str(),
                ) {
                    // 检查此账号是否是活跃账号
                    let is_active = active_account_id
                        .map(|active_id| active_id == id)
                        .unwrap_or(false);

                    let account = Account {
                        id: id.to_string(),
                        name: name.to_string(),
                        endpoint: endpoint.to_string(),
                        access_key_id: access_key_id.to_string(),
                        created_at: chrono::Utc::now(),
                        is_active,
                    };
                    self.accounts_cache.insert(id.to_string(), account);
                }
            }
        }

        info!("Loaded {} accounts from file", self.accounts_cache.len());
        Ok(())
    }

    fn save_accounts_to_file(&self) -> AppResult<()> {
        debug!("Saving accounts to file...");

        let accounts: Vec<serde_json::Value> = self
            .accounts_cache
            .values()
            .map(|account| {
                serde_json::json!({
                    "id": account.id,
                    "name": account.name,
                    "endpoint": account.endpoint,
                    "access_key_id": account.access_key_id,
                })
            })
            .collect();

        // 获取当前活跃的账号ID
        let active_account_id = self.get_active_account().map(|a| a.id);

        let data = serde_json::json!({
            "accounts": accounts,
            "active_account_id": active_account_id,
        });

        let content = serde_json::to_string_pretty(&data).map_err(AppError::Serialization)?;

        fs::write(&self.storage_path, content).map_err(AppError::Io)?;

        info!("Saved {} accounts to file", self.accounts_cache.len());
        Ok(())
    }

    fn load_accounts_from_keyring(&mut self) -> AppResult<()> {
        debug!("Loading accounts from keyring...");

        // 首先加载活跃账号ID（如果存在）
        let active_account_id = self.load_active_account_id_from_keyring()?;

        let index_entry = match Entry::new(SERVICE_NAME, ACCOUNTS_INDEX_KEY) {
            Ok(entry) => entry,
            Err(e) => {
                error!("Failed to create keyring entry for accounts index: {:?}", e);
                return Err(AppError::Keyring(e));
            }
        };

        match index_entry.get_password() {
            Ok(index_json) => {
                debug!("Found accounts index in keyring");
                let account_ids: Vec<String> = serde_json::from_str(&index_json).map_err(|e| {
                    error!("Failed to parse accounts index JSON: {}", e);
                    AppError::Config(format!("Failed to parse accounts index: {}", e))
                })?;

                info!("Found {} account IDs in index", account_ids.len());

                for id in account_ids {
                    debug!("Loading account: {}", id);
                    match self.load_single_account_from_keyring(&id, active_account_id.as_deref()) {
                        Ok(account) => {
                            self.accounts_cache.insert(id.clone(), account);
                        }
                        Err(e) => {
                            warn!("Failed to load account {}: {}", id, e);
                        }
                    }
                }
            }
            Err(e) => {
                debug!(
                    "No accounts index found in keyring (this is normal for first run): {:?}",
                    e
                );
            }
        }

        Ok(())
    }

    fn load_active_account_id_from_keyring(&self) -> AppResult<Option<String>> {
        let entry = Entry::new(SERVICE_NAME, "__active_account__");
        match entry {
            Ok(e) => match e.get_password() {
                Ok(id) => {
                    debug!("Found active account ID in keyring: {}", id);
                    Ok(Some(id))
                }
                Err(_) => Ok(None),
            },
            Err(_) => Ok(None),
        }
    }

    fn save_active_account_id_to_keyring(&self, id: Option<&str>) -> AppResult<()> {
        let entry = Entry::new(SERVICE_NAME, "__active_account__")?;
        match id {
            Some(active_id) => {
                entry.set_password(active_id).map_err(AppError::Keyring)?;
                debug!("Saved active account ID to keyring: {}", active_id);
            }
            None => {
                // 清除活跃账号ID，忽略错误（可能本来就不存在）
                let _ = entry.delete_password();
                debug!("Cleared active account ID from keyring");
            }
        }
        Ok(())
    }

    fn load_single_account_from_keyring(
        &self,
        id: &str,
        active_account_id: Option<&str>,
    ) -> AppResult<Account> {
        let entry = Entry::new(SERVICE_NAME, id)?;
        let password = entry.get_password()?;
        let data: serde_json::Value = serde_json::from_str(&password).map_err(|e| {
            error!("Failed to parse account data for {}: {}", id, e);
            AppError::Serialization(e)
        })?;

        let name = data["name"]
            .as_str()
            .ok_or_else(|| AppError::Config(format!("Account {} missing name field", id)))?;
        let endpoint = data["endpoint"]
            .as_str()
            .ok_or_else(|| AppError::Config(format!("Account {} missing endpoint field", id)))?;
        let access_key_id = data["access_key_id"].as_str().ok_or_else(|| {
            AppError::Config(format!("Account {} missing access_key_id field", id))
        })?;

        // 检查此账号是否是活跃账号
        let is_active = active_account_id
            .map(|active_id| active_id == id)
            .unwrap_or(false);

        Ok(Account {
            id: id.to_string(),
            name: name.to_string(),
            endpoint: endpoint.to_string(),
            access_key_id: access_key_id.to_string(),
            created_at: chrono::Utc::now(),
            is_active,
        })
    }

    fn save_accounts_index(&self) -> AppResult<()> {
        let account_ids: Vec<String> = self.accounts_cache.keys().cloned().collect();
        let index_entry = Entry::new(SERVICE_NAME, ACCOUNTS_INDEX_KEY)?;
        let index_json = serde_json::to_string(&account_ids).map_err(|e| {
            error!("Failed to serialize accounts index: {}", e);
            AppError::Config(format!("Failed to serialize accounts index: {}", e))
        })?;

        index_entry.set_password(&index_json).map_err(|e| {
            error!("Failed to save accounts index to keyring: {:?}", e);
            AppError::Keyring(e)
        })?;

        debug!("Saved accounts index with {} accounts", account_ids.len());
        Ok(())
    }

    pub fn save_account(&mut self, input: AccountInput) -> AppResult<Account> {
        info!(
            "Saving new account: {} (endpoint: {})",
            input.name, input.endpoint
        );

        let id = uuid::Uuid::new_v4().to_string();
        debug!("Generated account ID: {}", id);

        let account = Account {
            id: id.clone(),
            name: input.name.clone(),
            endpoint: input.endpoint.clone(),
            access_key_id: input.access_key_id.clone(),
            created_at: chrono::Utc::now(),
            is_active: false,
        };

        if self.use_file_storage {
            self.save_account_to_file(&id, &account, &input)?;
        } else {
            match self.save_account_to_keyring(&id, &account, &input) {
                Ok(_) => {}
                Err(e) => {
                    warn!(
                        "Failed to save to keyring: {}. Falling back to file storage.",
                        e
                    );
                    self.use_file_storage = true;
                    self.save_account_to_file(&id, &account, &input)?;
                }
            }
        }

        self.accounts_cache.insert(id.clone(), account.clone());
        info!(
            "Account saved successfully: {} (ID: {})",
            account.name, account.id
        );
        Ok(account)
    }

    fn save_account_to_keyring(
        &self,
        id: &str,
        account: &Account,
        input: &AccountInput,
    ) -> AppResult<()> {
        debug!("Creating keyring entry for account...");
        let entry = match Entry::new(SERVICE_NAME, id) {
            Ok(e) => e,
            Err(e) => {
                error!("Failed to create keyring entry: {:?}", e);
                return Err(AppError::Keyring(e));
            }
        };

        let secret_data = serde_json::json!({
            "name": account.name,
            "endpoint": account.endpoint,
            "access_key_id": input.access_key_id,
            "secret_access_key": input.secret_access_key,
        });

        let password = secret_data.to_string();
        debug!(
            "Saving account data to keyring (data length: {} bytes)",
            password.len()
        );

        match entry.set_password(&password) {
            Ok(_) => {
                info!("Successfully saved account credentials to keyring");
            }
            Err(e) => {
                error!("Failed to save account credentials to keyring: {:?}", e);
                return Err(AppError::Keyring(e));
            }
        }

        if let Err(e) = self.save_accounts_index() {
            error!("Failed to save accounts index: {}. Account data is saved but index may be inconsistent.", e);
        }

        Ok(())
    }

    fn save_account_to_file(
        &self,
        id: &str,
        account: &Account,
        input: &AccountInput,
    ) -> AppResult<()> {
        debug!("Saving account to file storage...");

        let accounts_file = self.storage_path.with_extension("secrets.json");

        let mut secrets: HashMap<String, serde_json::Value> = if accounts_file.exists() {
            let content = fs::read_to_string(&accounts_file).map_err(AppError::Io)?;
            serde_json::from_str(&content).map_err(AppError::Serialization)?
        } else {
            HashMap::new()
        };

        secrets.insert(
            id.to_string(),
            serde_json::json!({
                "name": account.name,
                "endpoint": account.endpoint,
                "access_key_id": input.access_key_id,
                "secret_access_key": input.secret_access_key,
            }),
        );

        let content = serde_json::to_string_pretty(&secrets).map_err(AppError::Serialization)?;

        fs::write(&accounts_file, content).map_err(AppError::Io)?;

        self.save_accounts_to_file()?;

        info!("Successfully saved account to file");
        Ok(())
    }

    pub fn update_account(&mut self, id: &str, input: AccountInput) -> AppResult<Account> {
        info!("Updating account: {} (ID: {})", input.name, id);

        if !self.accounts_cache.contains_key(id) {
            return Err(AppError::AccountNotFound(id.to_string()));
        }

        let old_account = self.accounts_cache.get(id).unwrap();
        let is_active = old_account.is_active;

        let account = Account {
            id: id.to_string(),
            name: input.name.clone(),
            endpoint: input.endpoint.clone(),
            access_key_id: input.access_key_id.clone(),
            created_at: old_account.created_at,
            is_active,
        };

        if self.use_file_storage {
            self.update_account_in_file(id, &account, &input)?;
        } else {
            match self.update_account_in_keyring(id, &account, &input) {
                Ok(_) => {}
                Err(e) => {
                    warn!(
                        "Failed to update in keyring: {}. Falling back to file storage.",
                        e
                    );
                    self.use_file_storage = true;
                    self.update_account_in_file(id, &account, &input)?;
                }
            }
        }

        self.accounts_cache.insert(id.to_string(), account.clone());
        info!(
            "Account updated successfully: {} (ID: {})",
            account.name, account.id
        );
        Ok(account)
    }

    fn update_account_in_keyring(
        &self,
        id: &str,
        account: &Account,
        input: &AccountInput,
    ) -> AppResult<()> {
        debug!("Updating account in keyring...");
        let entry = Entry::new(SERVICE_NAME, id)?;

        let mut secret_data = serde_json::json!({
            "name": account.name,
            "endpoint": account.endpoint,
            "access_key_id": input.access_key_id,
        });

        if !input.secret_access_key.is_empty() {
            secret_data["secret_access_key"] = serde_json::json!(input.secret_access_key);
        } else {
            let existing: serde_json::Value = serde_json::from_str(&entry.get_password()?)?;
            if let Some(existing_secret) = existing["secret_access_key"].as_str() {
                secret_data["secret_access_key"] = serde_json::json!(existing_secret);
            }
        }

        entry
            .set_password(&secret_data.to_string())
            .map_err(AppError::Keyring)?;

        info!("Successfully updated account in keyring");
        Ok(())
    }

    fn update_account_in_file(
        &self,
        id: &str,
        account: &Account,
        input: &AccountInput,
    ) -> AppResult<()> {
        debug!("Updating account in file storage...");

        let accounts_file = self.storage_path.with_extension("secrets.json");

        let mut secrets: HashMap<String, serde_json::Value> = if accounts_file.exists() {
            let content = fs::read_to_string(&accounts_file).map_err(AppError::Io)?;
            serde_json::from_str(&content).map_err(AppError::Serialization)?
        } else {
            return Err(AppError::AccountNotFound(id.to_string()));
        };

        let mut updated_data = serde_json::json!({
            "name": account.name,
            "endpoint": account.endpoint,
            "access_key_id": input.access_key_id,
        });

        if !input.secret_access_key.is_empty() {
            updated_data["secret_access_key"] = serde_json::json!(input.secret_access_key);
        } else if let Some(existing) = secrets.get(id) {
            if let Some(existing_secret) = existing["secret_access_key"].as_str() {
                updated_data["secret_access_key"] = serde_json::json!(existing_secret);
            }
        }

        secrets.insert(id.to_string(), updated_data);

        let content = serde_json::to_string_pretty(&secrets).map_err(AppError::Serialization)?;
        fs::write(&accounts_file, content).map_err(AppError::Io)?;

        self.save_accounts_to_file()?;

        info!("Successfully updated account in file");
        Ok(())
    }

    pub fn get_secret_key(&self, account_id: &str) -> AppResult<String> {
        debug!("Retrieving secret key for account: {}", account_id);

        if self.use_file_storage {
            let accounts_file = self.storage_path.with_extension("secrets.json");
            let content = fs::read_to_string(&accounts_file).map_err(AppError::Io)?;
            let secrets: HashMap<String, serde_json::Value> =
                serde_json::from_str(&content).map_err(AppError::Serialization)?;

            match secrets.get(account_id) {
                Some(data) => match data["secret_access_key"].as_str() {
                    Some(key) => Ok(key.to_string()),
                    None => Err(AppError::Config(
                        "Secret key not found in stored data".to_string(),
                    )),
                },
                None => Err(AppError::AccountNotFound(account_id.to_string())),
            }
        } else {
            let entry = Entry::new(SERVICE_NAME, account_id)?;
            let password = entry.get_password()?;
            let data: serde_json::Value = serde_json::from_str(&password)?;

            match data["secret_access_key"].as_str() {
                Some(key) => {
                    debug!(
                        "Successfully retrieved secret key for account: {}",
                        account_id
                    );
                    Ok(key.to_string())
                }
                None => {
                    error!("Secret key not found in account data: {}", account_id);
                    Err(AppError::Config(
                        "Secret key not found in stored account data".to_string(),
                    ))
                }
            }
        }
    }

    pub fn list_accounts(&self) -> Vec<Account> {
        debug!("Listing {} accounts", self.accounts_cache.len());
        self.accounts_cache.values().cloned().collect()
    }

    pub fn get_account(&self, id: &str) -> AppResult<Account> {
        debug!("Retrieving account: {}", id);
        match self.accounts_cache.get(id).cloned() {
            Some(account) => {
                debug!("Found account: {}", account.name);
                Ok(account)
            }
            None => {
                warn!("Account not found in cache: {}", id);
                Err(AppError::AccountNotFound(id.to_string()))
            }
        }
    }

    pub fn delete_account(&mut self, id: &str) -> AppResult<()> {
        info!("Deleting account: {}", id);

        if self.use_file_storage {
            let accounts_file = self.storage_path.with_extension("secrets.json");
            if accounts_file.exists() {
                let content = fs::read_to_string(&accounts_file).map_err(AppError::Io)?;
                let mut secrets: HashMap<String, serde_json::Value> =
                    serde_json::from_str(&content).map_err(AppError::Serialization)?;
                secrets.remove(id);
                let content =
                    serde_json::to_string_pretty(&secrets).map_err(AppError::Serialization)?;
                fs::write(&accounts_file, content).map_err(AppError::Io)?;
            }
        } else {
            let entry = Entry::new(SERVICE_NAME, id)?;
            match entry.delete_password() {
                Ok(_) => {
                    info!("Deleted account credentials from keyring");
                }
                Err(e) => {
                    warn!("Failed to delete account credentials from keyring: {:?}", e);
                }
            }
        }

        self.accounts_cache.remove(id);
        self.save_accounts_to_file()?;

        info!("Account deleted successfully");
        Ok(())
    }

    pub fn set_active_account(&mut self, id: Option<&str>) -> AppResult<()> {
        if let Some(id) = id {
            info!("Setting active account: {}", id);
        } else {
            info!("Clearing active account");
        }

        for (_, account) in self.accounts_cache.iter_mut() {
            account.is_active = false;
        }

        if let Some(id) = id {
            if let Some(account) = self.accounts_cache.get_mut(id) {
                account.is_active = true;
                info!("Active account set to: {}", account.name);
            } else {
                error!("Failed to set active account: Account {} not found", id);
                return Err(AppError::AccountNotFound(id.to_string()));
            }
        }

        // 持久化活跃账号ID
        if self.use_file_storage {
            self.save_accounts_to_file()?;
        } else {
            self.save_active_account_id_to_keyring(id)?;
        }

        Ok(())
    }

    pub fn get_active_account(&self) -> Option<Account> {
        let active = self.accounts_cache.values().find(|a| a.is_active).cloned();
        if let Some(ref account) = active {
            debug!("Active account: {}", account.name);
        } else {
            debug!("No active account");
        }
        active
    }
}
