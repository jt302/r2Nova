use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("R2 API 错误: {0}")]
    R2Error(String),

    #[error("S3 客户端错误: {0}")]
    S3Error(String),

    #[error("配置错误: {0}")]
    Config(String),

    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("验证错误: {field} - {message}")]
    Validation { field: String, message: String },

    #[error("密钥存储错误: {0}")]
    Keyring(#[from] keyring::Error),

    #[error("序列化错误: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("账户未找到: {0}")]
    AccountNotFound(String),

    #[error("传输任务未找到: {0}")]
    TransferNotFound(String),

    #[error("Bucket 未找到: {0}")]
    BucketNotFound(String),

    #[error("对象未找到: {0}")]
    ObjectNotFound(String),

    #[error("网络错误: {0}")]
    Network(String),

    #[error("未知错误: {0}")]
    Unknown(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type AppResult<T> = Result<T, AppError>;
