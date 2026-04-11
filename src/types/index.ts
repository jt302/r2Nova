export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface Account {
  id: string
  name: string
  endpoint: string
  access_key_id: string
  created_at: string
  is_active: boolean
}

export interface BucketInfo {
  name: string
  creation_date?: string
  object_count?: number
  total_size?: number
}

export interface ObjectInfo {
  key: string
  size: number
  last_modified?: string
  etag?: string
  is_directory: boolean
  is_uploading?: boolean
  upload_progress?: number
  upload_speed?: number
  upload_status?: string
  upload_id?: string
}

export interface TransferTask {
  id: string
  transfer_type: 'upload' | 'download'
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed'
  bucket: string
  key: string
  local_path: string
  bytes_total: number
  bytes_transferred: number
  speed_mbps: number
  created_at: string
  updated_at: string
}

export interface PreviewResponse {
  data: number[]
  content_type: string
}

export interface MultipartUploadInfo {
  key: string
  upload_id: string
  initiated?: string
  storage_class?: string
}
