import { invoke } from '@tauri-apps/api/core'
import {
  ApiResponse,
  Account,
  BucketInfo,
  ObjectInfo,
  PreviewResponse,
  MultipartUploadInfo,
} from '../types'

export const accountService = {
  async saveAccount(input: {
    name: string
    endpoint: string
    accessKeyId: string
    secretAccessKey: string
  }) {
    const response = await invoke<ApiResponse<{ account: Account }>>('save_account', {
      request: {
        name: input.name,
        endpoint: input.endpoint,
        access_key_id: input.accessKeyId,
        secret_access_key: input.secretAccessKey,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to save account')
    }
    return response.data!.account
  },

  async listAccounts() {
    const response =
      await invoke<ApiResponse<{ accounts: Account[]; active_account_id: string | null }>>(
        'list_accounts'
      )
    if (!response.success) {
      throw new Error(response.error || 'Failed to list accounts')
    }
    return response.data!
  },

  async deleteAccount(id: string) {
    const response = await invoke<ApiResponse<null>>('delete_account', { id })
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete account')
    }
  },

  async updateAccount(
    id: string,
    input: {
      name: string
      endpoint: string
      accessKeyId: string
      secretAccessKey: string
    }
  ) {
    const response = await invoke<ApiResponse<{ account: Account }>>('update_account', {
      request: {
        id,
        name: input.name,
        endpoint: input.endpoint,
        access_key_id: input.accessKeyId,
        secret_access_key: input.secretAccessKey,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to update account')
    }
    return response.data!.account
  },

  async setCurrentAccount(id: string) {
    const response = await invoke<ApiResponse<null>>('set_current_account', { id })
    if (!response.success) {
      throw new Error(response.error || 'Failed to set current account')
    }
  },
}

export const bucketService = {
  async listBuckets() {
    const response = await invoke<ApiResponse<{ buckets: BucketInfo[] }>>('list_buckets')
    if (!response.success) {
      throw new Error(response.error || 'Failed to list buckets')
    }
    return response.data!.buckets
  },

  async getBucketInfo(bucket: string) {
    const response = await invoke<ApiResponse<BucketInfo>>('get_bucket_info', {
      bucket,
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to get bucket info')
    }
    return response.data!
  },
}

export const fileService = {
  async listObjects(bucket: string, prefix?: string, continuationToken?: string) {
    const response = await invoke<
      ApiResponse<{ objects: ObjectInfo[]; next_token: string | null }>
    >('list_objects', {
      request: {
        bucket,
        prefix: prefix || null,
        continuation_token: continuationToken || null,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to list objects')
    }
    return response.data!
  },

  async uploadFile(bucket: string, key: string, localPath: string) {
    const response = await invoke<ApiResponse<{ task_id: string }>>('upload_file', {
      request: {
        bucket,
        key,
        local_path: localPath,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to upload file')
    }
    return response.data!.task_id
  },

  async downloadFile(bucket: string, key: string, localPath: string) {
    const response = await invoke<ApiResponse<{ task_id: string }>>('download_file', {
      request: {
        bucket,
        key,
        local_path: localPath,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to download file')
    }
    return response.data!.task_id
  },

  async deleteObject(bucket: string, key: string) {
    const response = await invoke<ApiResponse<null>>('delete_object', {
      bucket,
      key,
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete object')
    }
  },

  async createFolder(bucket: string, key: string) {
    const response = await invoke<ApiResponse<null>>('create_folder', {
      request: {
        bucket,
        key,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to create folder')
    }
  },

  async deleteFolder(bucket: string, key: string) {
    const response = await invoke<ApiResponse<null>>('delete_folder', {
      request: {
        bucket,
        key,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete folder')
    }
  },

  async previewFolderContents(bucket: string, key: string, limit?: number) {
    const response = await invoke<
      ApiResponse<{ objects: ObjectInfo[]; has_more: boolean; total_count: number }>
    >('preview_folder_contents', {
      request: {
        bucket,
        key,
        limit: limit || 100,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to preview folder contents')
    }
    return response.data!
  },

  async getObjectPreview(bucket: string, key: string) {
    const response = await invoke<ApiResponse<PreviewResponse>>('get_object_preview', {
      bucket,
      key,
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to get preview')
    }
    return response.data!
  },

  async listMultipartUploads(bucket: string, prefix?: string) {
    const response = await invoke<ApiResponse<{ uploads: MultipartUploadInfo[] }>>(
      'list_multipart_uploads',
      {
        request: {
          bucket,
          prefix: prefix || null,
        },
      }
    )
    if (!response.success) {
      throw new Error(response.error || 'Failed to list multipart uploads')
    }
    return response.data!.uploads
  },

  async abortMultipartUpload(bucket: string, key: string, uploadId: string) {
    const response = await invoke<ApiResponse<null>>('abort_multipart_upload', {
      request: {
        bucket,
        key,
        upload_id: uploadId,
      },
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to abort multipart upload')
    }
  },
}
