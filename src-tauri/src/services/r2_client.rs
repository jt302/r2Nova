use aws_config::BehaviorVersion;
use aws_sdk_s3::{Client, Config};
use std::collections::HashMap;
use std::path::Path;
use tokio::io::AsyncWriteExt;
use tracing::{error, info};

use crate::errors::{AppError, AppResult};
use crate::models::{Account, BucketInfo, ObjectInfo};

type ObjectTimestamp = Option<chrono::DateTime<chrono::Utc>>;

fn folder_key(key: &str) -> String {
    if key.ends_with('/') {
        key.to_string()
    } else {
        format!("{}/", key)
    }
}

fn normalized_prefix(prefix: Option<&str>) -> Option<String> {
    prefix.filter(|value| !value.is_empty()).map(folder_key)
}

fn object_info_from_common_prefix(prefix: &str) -> Option<ObjectInfo> {
    if prefix.is_empty() {
        return None;
    }

    Some(ObjectInfo {
        key: folder_key(prefix),
        size: 0,
        last_modified: None,
        etag: None,
        is_directory: true,
    })
}

fn object_info_from_listed_object(
    key: &str,
    size: i64,
    last_modified: ObjectTimestamp,
    etag: Option<String>,
    prefix: Option<&str>,
) -> Option<ObjectInfo> {
    if key.is_empty() {
        return None;
    }

    let remainder = match normalized_prefix(prefix) {
        Some(prefix) => {
            if key == prefix {
                return None;
            }
            key.strip_prefix(&prefix)?
        }
        None => key,
    };

    if remainder.is_empty() || remainder.contains('/') {
        return None;
    }

    Some(ObjectInfo {
        key: key.to_string(),
        size,
        last_modified,
        etag,
        is_directory: key.ends_with('/'),
    })
}

pub struct R2Client {
    client: Client,
}

impl R2Client {
    pub async fn new(account: &Account, secret_key: &str) -> AppResult<Self> {
        info!(
            "Creating R2Client for account: {} (endpoint: {})",
            account.name, account.endpoint
        );

        let endpoint_url = if account.endpoint.starts_with("http://")
            || account.endpoint.starts_with("https://")
        {
            account.endpoint.clone()
        } else {
            format!("https://{}", account.endpoint)
        };

        info!("Using endpoint URL: {}", endpoint_url);

        let credentials = aws_sdk_s3::config::Credentials::new(
            &account.access_key_id,
            secret_key,
            None,
            None,
            "r2nova",
        );

        let config = Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .endpoint_url(endpoint_url)
            .credentials_provider(credentials)
            .region(aws_sdk_s3::config::Region::new("auto"))
            .build();

        let client = Client::from_conf(config);

        info!("R2Client created successfully");

        Ok(Self { client })
    }

    pub async fn list_buckets(&self) -> AppResult<Vec<BucketInfo>> {
        info!("Listing buckets...");

        let resp = match self.client.list_buckets().send().await {
            Ok(resp) => {
                info!("Successfully listed buckets");
                resp
            }
            Err(e) => {
                error!("Failed to list buckets: {:?}", e);
                let error_msg = format!("{:?}", e);

                if error_msg.contains("dispatch") {
                    return Err(AppError::S3Error(
                            "网络连接失败，请检查: 1) 网络连接是否正常 2) R2 端点地址是否正确 3) 是否有代理或防火墙阻挡".to_string()
                        ));
                }

                if error_msg.contains("credential")
                    || error_msg.contains("auth")
                    || error_msg.contains("signature")
                {
                    return Err(AppError::S3Error(
                        "认证失败，请检查 Access Key ID 和 Secret Access Key 是否正确".to_string(),
                    ));
                }

                return Err(AppError::S3Error(format!("S3 请求失败: {}", e)));
            }
        };

        let buckets: Vec<BucketInfo> = resp
            .buckets()
            .iter()
            .map(|b| BucketInfo {
                name: b.name().unwrap_or("").to_string(),
                creation_date: b
                    .creation_date()
                    .and_then(|d| chrono::DateTime::from_timestamp(d.secs(), d.subsec_nanos())),
                object_count: None,
                total_size: None,
            })
            .collect();

        info!("Found {} buckets", buckets.len());
        Ok(buckets)
    }

    pub async fn list_objects(
        &self,
        bucket: &str,
        prefix: Option<&str>,
        continuation_token: Option<String>,
    ) -> AppResult<(Vec<ObjectInfo>, Option<String>)> {
        info!(
            "Listing objects in bucket: {}, prefix: {:?}",
            bucket, prefix
        );

        let mut req = self
            .client
            .list_objects_v2()
            .bucket(bucket)
            .delimiter("/")
            .max_keys(100);

        if let Some(prefix) = prefix {
            req = req.prefix(prefix);
        }

        if let Some(token) = continuation_token {
            req = req.continuation_token(token);
        }

        let resp = match req.send().await {
            Ok(resp) => {
                info!("Successfully listed objects");
                resp
            }
            Err(e) => {
                error!("Failed to list objects: {:?}", e);
                let error_msg = format!("{:?}", e);

                if error_msg.contains("dispatch") {
                    return Err(AppError::S3Error(
                        "网络连接失败，请检查网络连接是否正常".to_string(),
                    ));
                }

                if error_msg.contains("credential")
                    || error_msg.contains("auth")
                    || error_msg.contains("signature")
                {
                    return Err(AppError::S3Error(
                        "认证失败，请检查密钥是否正确".to_string(),
                    ));
                }

                return Err(AppError::S3Error(format!("S3 请求失败: {}", e)));
            }
        };

        let mut objects: Vec<ObjectInfo> = resp
            .common_prefixes()
            .iter()
            .filter_map(|prefix| prefix.prefix().and_then(object_info_from_common_prefix))
            .collect();

        objects.extend(resp.contents().iter().filter_map(|obj| {
            object_info_from_listed_object(
                obj.key().unwrap_or(""),
                obj.size().unwrap_or(0),
                obj.last_modified()
                    .and_then(|d| chrono::DateTime::from_timestamp(d.secs(), d.subsec_nanos())),
                obj.e_tag().map(|e| e.to_string()),
                prefix,
            )
        }));

        let next_token = resp.next_continuation_token().map(|s| s.to_string());

        info!("Found {} objects", objects.len());
        Ok((objects, next_token))
    }

    pub async fn get_object(&self, bucket: &str, key: &str) -> AppResult<bytes::Bytes> {
        let resp = self
            .client
            .get_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| AppError::S3Error(e.to_string()))?;

        let data = resp
            .body
            .collect()
            .await
            .map_err(|e| AppError::S3Error(e.to_string()))?;

        Ok(data.into_bytes())
    }

    pub async fn get_object_head(
        &self,
        bucket: &str,
        key: &str,
    ) -> AppResult<aws_sdk_s3::operation::head_object::HeadObjectOutput> {
        let resp = self
            .client
            .head_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| AppError::S3Error(e.to_string()))?;

        Ok(resp)
    }

    pub async fn download_object_with_progress<F>(
        &self,
        bucket: &str,
        key: &str,
        local_path: &Path,
        _total_bytes: i64,
        mut progress_callback: F,
    ) -> AppResult<()>
    where
        F: FnMut(i64, f64) + Send,
    {
        let resp = self
            .client
            .get_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| AppError::S3Error(e.to_string()))?;

        let mut stream = resp.body.into_async_read();
        let mut file = tokio::fs::File::create(local_path)
            .await
            .map_err(AppError::Io)?;

        let mut downloaded: i64 = 0;
        let start_time = std::time::Instant::now();
        let mut buffer = vec![0u8; 64 * 1024];

        loop {
            match tokio::io::AsyncReadExt::read(&mut stream, &mut buffer).await {
                Ok(0) => break,
                Ok(n) => {
                    file.write_all(&buffer[..n]).await.map_err(AppError::Io)?;
                    downloaded += n as i64;

                    let elapsed_secs = start_time.elapsed().as_secs_f64();
                    let speed_mbps = if elapsed_secs > 0.0 {
                        (downloaded as f64 / 1024.0 / 1024.0) / elapsed_secs
                    } else {
                        0.0
                    };

                    progress_callback(downloaded, speed_mbps);
                }
                Err(e) => return Err(AppError::S3Error(e.to_string())),
            }
        }

        file.flush().await.map_err(AppError::Io)?;
        Ok(())
    }

    pub async fn put_object(&self, bucket: &str, key: &str, data: bytes::Bytes) -> AppResult<()> {
        self.client
            .put_object()
            .bucket(bucket)
            .key(key)
            .body(data.into())
            .send()
            .await
            .map_err(|e| AppError::S3Error(e.to_string()))?;

        Ok(())
    }

    pub async fn upload_object_with_progress<F>(
        &self,
        bucket: &str,
        key: &str,
        local_path: &std::path::Path,
        total_bytes: i64,
        mut progress_callback: F,
    ) -> AppResult<()>
    where
        F: FnMut(i64, f64) + Send,
    {
        use aws_sdk_s3::types::CompletedPart;
        use tokio::io::AsyncReadExt;

        const CHUNK_SIZE: usize = 8 * 1024 * 1024;
        const MIN_MULTIPART_SIZE: i64 = 8 * 1024 * 1024;

        info!(
            "UPLOAD START: file_size={}, threshold={}, path={:?}",
            total_bytes, MIN_MULTIPART_SIZE, local_path
        );

        let mut file = tokio::fs::File::open(local_path)
            .await
            .map_err(AppError::Io)?;

        if total_bytes < MIN_MULTIPART_SIZE {
            info!(
                "File size {} bytes is smaller than multipart threshold, using put_object",
                total_bytes
            );

            let mut buffer = Vec::with_capacity(total_bytes as usize);
            file.read_to_end(&mut buffer).await.map_err(AppError::Io)?;

            self.client
                .put_object()
                .bucket(bucket)
                .key(key)
                .body(aws_sdk_s3::primitives::ByteStream::from(buffer))
                .send()
                .await
                .map_err(|e| AppError::S3Error(format!("Failed to upload file: {}", e)))?;

            progress_callback(total_bytes, 0.0);
            info!(
                "Successfully uploaded small file {} bytes for key: {}",
                total_bytes, key
            );
            return Ok(());
        }

        info!(
            "Using MULTIPART upload for file size: {} bytes",
            total_bytes
        );

        let create_resp = self
            .client
            .create_multipart_upload()
            .bucket(bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| AppError::S3Error(e.to_string()))?;

        let upload_id = create_resp
            .upload_id()
            .ok_or_else(|| AppError::S3Error("Failed to get upload ID".to_string()))?;

        // 用于清理的闭包 - 在出错时中止 multipart upload
        let abort_upload = || async {
            let _ = self
                .client
                .abort_multipart_upload()
                .bucket(bucket)
                .key(key)
                .upload_id(upload_id)
                .send()
                .await;
            info!("Aborted multipart upload for key: {}", key);
        };

        let mut parts: Vec<CompletedPart> = Vec::new();
        let mut part_number = 1;
        let mut uploaded_bytes: i64 = 0;
        let start_time = std::time::Instant::now();

        const MIN_PART_SIZE: usize = 5 * 1024 * 1024;
        const READ_BUFFER_SIZE: usize = 64 * 1024;

        let mut part_buffer: Vec<u8> = Vec::with_capacity(CHUNK_SIZE);
        let mut read_buffer = vec![0u8; READ_BUFFER_SIZE];

        loop {
            let bytes_read = match file.read(&mut read_buffer).await {
                Ok(n) => n,
                Err(e) => {
                    let error_msg = format!("读取文件失败: {}", e);
                    error!("{}", error_msg);
                    abort_upload().await;
                    return Err(AppError::Io(e));
                }
            };

            if bytes_read == 0 {
                break;
            }

            part_buffer.extend_from_slice(&read_buffer[..bytes_read]);

            while part_buffer.len() >= MIN_PART_SIZE {
                let upload_size = if part_buffer.len() >= CHUNK_SIZE {
                    CHUNK_SIZE
                } else {
                    part_buffer.len()
                };

                let part_data = bytes::Bytes::copy_from_slice(&part_buffer[..upload_size]);

                info!("Uploading part {}: size={} bytes", part_number, upload_size);

                let upload_resp = self
                    .client
                    .upload_part()
                    .bucket(bucket)
                    .key(key)
                    .upload_id(upload_id)
                    .part_number(part_number)
                    .body(part_data.into())
                    .send()
                    .await;

                match upload_resp {
                    Ok(resp) => {
                        parts.push(
                            CompletedPart::builder()
                                .part_number(part_number)
                                .e_tag(resp.e_tag().unwrap_or_default())
                                .build(),
                        );
                    }
                    Err(e) => {
                        let error_msg = format!("上传分片 {} 失败: {}", part_number, e);
                        error!("{}", error_msg);
                        abort_upload().await;
                        return Err(AppError::S3Error(error_msg));
                    }
                }

                uploaded_bytes += upload_size as i64;
                part_number += 1;

                part_buffer = part_buffer.split_off(upload_size);

                let elapsed_secs = start_time.elapsed().as_secs_f64();
                let speed_mbps = if elapsed_secs > 0.0 {
                    (uploaded_bytes as f64 / 1024.0 / 1024.0) / elapsed_secs
                } else {
                    0.0
                };

                progress_callback(uploaded_bytes, speed_mbps);
            }
        }

        if !part_buffer.is_empty() {
            let last_part_size = part_buffer.len();
            info!(
                "Uploading final part {}: size={} bytes",
                part_number, last_part_size
            );

            let part_data = bytes::Bytes::from(part_buffer);

            let upload_resp = self
                .client
                .upload_part()
                .bucket(bucket)
                .key(key)
                .upload_id(upload_id)
                .part_number(part_number)
                .body(part_data.into())
                .send()
                .await;

            match upload_resp {
                Ok(resp) => {
                    parts.push(
                        CompletedPart::builder()
                            .part_number(part_number)
                            .e_tag(resp.e_tag().unwrap_or_default())
                            .build(),
                    );
                }
                Err(e) => {
                    let error_msg = format!("上传最后一个分片 {} 失败: {}", part_number, e);
                    error!("{}", error_msg);
                    abort_upload().await;
                    return Err(AppError::S3Error(error_msg));
                }
            }

            uploaded_bytes += last_part_size as i64;

            let elapsed_secs = start_time.elapsed().as_secs_f64();
            let speed_mbps = if elapsed_secs > 0.0 {
                (uploaded_bytes as f64 / 1024.0 / 1024.0) / elapsed_secs
            } else {
                0.0
            };

            progress_callback(uploaded_bytes, speed_mbps);
        }

        parts.sort_by_key(|p| p.part_number());

        info!(
            "Upload complete: total_parts={}, uploaded_bytes={}, total_expected={}",
            parts.len(),
            uploaded_bytes,
            total_bytes
        );

        if parts.is_empty() {
            info!("Empty file detected, aborting multipart upload and using put_object instead");
            let _ = self
                .client
                .abort_multipart_upload()
                .bucket(bucket)
                .key(key)
                .upload_id(upload_id)
                .send()
                .await;

            self.client
                .put_object()
                .bucket(bucket)
                .key(key)
                .body(aws_sdk_s3::primitives::ByteStream::from_static(&[]))
                .send()
                .await
                .map_err(|e| AppError::S3Error(format!("Failed to upload empty file: {}", e)))?;

            info!("Successfully uploaded empty file for key: {}", key);
            return Ok(());
        }

        let completed_parts = aws_sdk_s3::types::CompletedMultipartUpload::builder()
            .set_parts(Some(parts))
            .build();

        let complete_result = self
            .client
            .complete_multipart_upload()
            .bucket(bucket)
            .key(key)
            .upload_id(upload_id)
            .multipart_upload(completed_parts)
            .send()
            .await;

        match complete_result {
            Ok(_) => {
                info!("Successfully completed multipart upload for key: {}", key);
                Ok(())
            }
            Err(e) => {
                let error_details = format!("{:?}", e);
                error!(
                    "Complete multipart upload failed with details: {}",
                    error_details
                );

                let abort_result = self
                    .client
                    .abort_multipart_upload()
                    .bucket(bucket)
                    .key(key)
                    .upload_id(upload_id)
                    .send()
                    .await;

                match abort_result {
                    Ok(_) => {
                        info!("Successfully aborted multipart upload after completion failure")
                    }
                    Err(abort_err) => error!(
                        "Failed to abort multipart upload after completion failure: {:?}",
                        abort_err
                    ),
                }

                Err(AppError::S3Error(format!(
                    "Failed to complete multipart upload: {} (Details: {})",
                    e, error_details
                )))
            }
        }
    }

    pub async fn delete_object(&self, bucket: &str, key: &str) -> AppResult<()> {
        self.client
            .delete_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| AppError::S3Error(e.to_string()))?;

        Ok(())
    }

    pub async fn create_folder(&self, bucket: &str, key: &str) -> AppResult<()> {
        // 确保 key 以 / 结尾表示这是一个目录
        let folder_key = folder_key(key);

        // 创建空对象表示目录
        self.client
            .put_object()
            .bucket(bucket)
            .key(&folder_key)
            .body(bytes::Bytes::new().into())
            .send()
            .await
            .map_err(|e| AppError::S3Error(e.to_string()))?;

        info!("Created folder: {}", folder_key);
        Ok(())
    }

    pub async fn delete_folder<F>(
        &self,
        bucket: &str,
        key: &str,
        mut progress_callback: F,
    ) -> AppResult<()>
    where
        F: FnMut(usize, usize) + Send,
    {
        // 确保 key 以 / 结尾，以便删除该前缀的所有对象
        let folder_prefix = folder_key(key);

        info!("Deleting folder and contents: {}", folder_prefix);

        // 列出所有带该前缀的对象
        let mut all_keys: Vec<String> = Vec::new();
        let mut continuation_token: Option<String> = None;

        loop {
            let mut req = self
                .client
                .list_objects_v2()
                .bucket(bucket)
                .prefix(&folder_prefix)
                .max_keys(1000);

            if let Some(token) = continuation_token {
                req = req.continuation_token(token);
            }

            let resp = req
                .send()
                .await
                .map_err(|e| AppError::S3Error(e.to_string()))?;

            for obj in resp.contents() {
                if let Some(key) = obj.key() {
                    all_keys.push(key.to_string());
                }
            }

            continuation_token = resp.next_continuation_token().map(|s| s.to_string());

            if continuation_token.is_none() {
                break;
            }
        }

        if all_keys.is_empty() {
            info!("No objects found with prefix: {}", folder_prefix);
            return Ok(());
        }

        let total_count = all_keys.len();
        info!("Found {} objects to delete", total_count);

        // 批量删除对象（每次最多1000个）
        use aws_sdk_s3::types::ObjectIdentifier;

        let mut deleted_count: usize = 0;

        // S3 DeleteObjects API 每次最多支持 1000 个对象
        for chunk in all_keys.chunks(1000) {
            let objects_to_delete: Vec<ObjectIdentifier> = chunk
                .iter()
                .map(|k| {
                    ObjectIdentifier::builder()
                        .key(k)
                        .build()
                        .expect("Failed to build ObjectIdentifier")
                })
                .collect();

            let delete_result = self
                .client
                .delete_objects()
                .bucket(bucket)
                .delete(
                    aws_sdk_s3::types::Delete::builder()
                        .set_objects(Some(objects_to_delete))
                        .build()
                        .expect("Failed to build Delete request"),
                )
                .send()
                .await
                .map_err(|e| AppError::S3Error(e.to_string()))?;

            // 记录删除结果
            let chunk_deleted = delete_result.deleted().len();
            let errors_count = delete_result.errors().len();

            if chunk_deleted > 0 {
                deleted_count += chunk_deleted;
                info!("Successfully deleted {} objects", chunk_deleted);
                progress_callback(deleted_count, total_count);
            }

            if errors_count > 0 {
                for error in delete_result.errors() {
                    error!(
                        "Failed to delete object {}: {} - {}",
                        error.key().unwrap_or("unknown"),
                        error.code().unwrap_or("unknown"),
                        error.message().unwrap_or("no message")
                    );
                }
                return Err(AppError::S3Error(format!(
                    "Failed to delete {} objects",
                    errors_count
                )));
            }
        }

        info!("Successfully deleted folder: {}", folder_prefix);
        Ok(())
    }

    pub async fn preview_folder_contents(
        &self,
        bucket: &str,
        key: &str,
        limit: i32,
    ) -> AppResult<(Vec<ObjectInfo>, bool)> {
        // 确保 key 以 / 结尾，以便匹配该前缀的所有对象
        let folder_prefix = folder_key(key);

        info!(
            "Previewing folder contents: {} (limit: {})",
            folder_prefix, limit
        );

        let mut objects: Vec<ObjectInfo> = Vec::new();
        let mut continuation_token: Option<String> = None;
        let mut has_more = false;
        let max_items = limit as usize;

        loop {
            let mut req = self
                .client
                .list_objects_v2()
                .bucket(bucket)
                .prefix(&folder_prefix)
                .max_keys(1000);

            if let Some(token) = continuation_token {
                req = req.continuation_token(token);
            }

            let resp = req
                .send()
                .await
                .map_err(|e| AppError::S3Error(e.to_string()))?;

            for obj in resp.contents() {
                if objects.len() >= max_items {
                    has_more = true;
                    break;
                }

                objects.push(ObjectInfo {
                    key: obj.key().unwrap_or("").to_string(),
                    size: obj.size().unwrap_or(0),
                    last_modified: obj
                        .last_modified()
                        .and_then(|d| chrono::DateTime::from_timestamp(d.secs(), d.subsec_nanos())),
                    etag: obj.e_tag().map(|e| e.to_string()),
                    is_directory: obj.key().map(|k| k.ends_with('/')).unwrap_or(false),
                });
            }

            if has_more || objects.len() >= max_items {
                break;
            }

            continuation_token = resp.next_continuation_token().map(|s| s.to_string());

            if continuation_token.is_none() {
                break;
            }
        }

        info!(
            "Found {} objects in folder (has_more: {})",
            objects.len(),
            has_more
        );
        Ok((objects, has_more))
    }

    pub async fn list_multipart_uploads(
        &self,
        bucket: &str,
        prefix: Option<&str>,
    ) -> AppResult<Vec<crate::models::MultipartUploadInfo>> {
        use crate::models::MultipartUploadInfo;

        info!(
            "Listing multipart uploads in bucket: {}, prefix: {:?}",
            bucket, prefix
        );

        let mut req = self.client.list_multipart_uploads().bucket(bucket);

        if let Some(prefix) = prefix {
            req = req.prefix(prefix);
        }

        let resp = match req.send().await {
            Ok(resp) => {
                info!("Successfully listed multipart uploads");
                resp
            }
            Err(e) => {
                error!("Failed to list multipart uploads: {:?}", e);
                return Err(AppError::S3Error(format!(
                    "Failed to list multipart uploads: {}",
                    e
                )));
            }
        };

        let uploads: Vec<MultipartUploadInfo> = resp
            .uploads()
            .iter()
            .map(|upload| MultipartUploadInfo {
                key: upload.key().unwrap_or("").to_string(),
                upload_id: upload.upload_id().unwrap_or("").to_string(),
                initiated: upload
                    .initiated()
                    .and_then(|d| chrono::DateTime::from_timestamp(d.secs(), d.subsec_nanos())),
                storage_class: upload.storage_class().map(|s| s.as_str().to_string()),
            })
            .collect();

        info!("Found {} multipart uploads", uploads.len());
        Ok(uploads)
    }

    pub async fn abort_multipart_upload(
        &self,
        bucket: &str,
        key: &str,
        upload_id: &str,
    ) -> AppResult<()> {
        info!(
            "Aborting multipart upload: bucket={}, key={}, upload_id={}",
            bucket, key, upload_id
        );

        match self
            .client
            .abort_multipart_upload()
            .bucket(bucket)
            .key(key)
            .upload_id(upload_id)
            .send()
            .await
        {
            Ok(_) => {
                info!("Successfully aborted multipart upload for key: {}", key);
                Ok(())
            }
            Err(e) => {
                error!("Failed to abort multipart upload: {:?}", e);
                Err(AppError::S3Error(format!(
                    "Failed to abort multipart upload: {}",
                    e
                )))
            }
        }
    }
}

pub struct R2ClientManager {
    clients: HashMap<String, R2Client>,
}

impl R2ClientManager {
    pub fn new() -> Self {
        Self {
            clients: HashMap::new(),
        }
    }

    pub async fn get_or_create(
        &mut self,
        account: &Account,
        secret_key: &str,
    ) -> AppResult<&R2Client> {
        if !self.clients.contains_key(&account.id) {
            let client = R2Client::new(account, secret_key).await?;
            self.clients.insert(account.id.clone(), client);
        }

        Ok(self.clients.get(&account.id).unwrap())
    }

    pub fn remove(&mut self, account_id: &str) {
        self.clients.remove(account_id);
    }
}

#[cfg(test)]
mod tests {
    use super::{folder_key, object_info_from_common_prefix, object_info_from_listed_object};

    #[test]
    fn folder_key_adds_trailing_slash() {
        assert_eq!(folder_key("photos/2026/raw"), "photos/2026/raw/");
    }

    #[test]
    fn folder_key_keeps_existing_trailing_slash() {
        assert_eq!(folder_key("photos/2026/raw/"), "photos/2026/raw/");
    }

    #[test]
    fn common_prefix_becomes_directory_object() {
        let directory = object_info_from_common_prefix("photos/").expect("directory object");

        assert_eq!(directory.key, "photos/");
        assert!(directory.is_directory);
        assert_eq!(directory.size, 0);
    }

    #[test]
    fn current_prefix_marker_is_filtered() {
        let object = object_info_from_listed_object("photos/", 0, None, None, Some("photos/"));

        assert!(object.is_none());
    }

    #[test]
    fn nested_object_is_not_shown_as_direct_child() {
        let object = object_info_from_listed_object("photos/2026/raw.jpg", 12, None, None, None);

        assert!(object.is_none());
    }
}
