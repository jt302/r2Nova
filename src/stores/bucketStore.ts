import { create } from 'zustand'
import { BucketInfo, ObjectInfo } from '../types'
import { bucketService, fileService } from '../services/r2Service'

interface BucketCache {
  accountId: string
  buckets: BucketInfo[]
  selectedBucket: string | null
  timestamp: number
}

interface CachedObjects {
  objects: ObjectInfo[]
  timestamp: number
}

interface BucketState {
  bucketCache: BucketCache | null
  objectsCache: Map<string, CachedObjects>
  isLoadingBuckets: boolean
  isLoadingObjects: boolean
  error: string | null

  loadBuckets: (accountId: string, forceRefresh?: boolean) => Promise<BucketInfo[]>
  loadObjects: (
    accountId: string,
    bucket: string,
    prefix: string,
    forceRefresh?: boolean
  ) => Promise<ObjectInfo[]>
  getCachedObjects: (accountId: string, bucket: string, prefix: string) => ObjectInfo[] | null
  setSelectedBucket: (bucket: string | null) => void
  clearCache: () => void
  addObjectToCache: (accountId: string, bucket: string, prefix: string, object: ObjectInfo) => void
  removeObjectFromCache: (accountId: string, bucket: string, prefix: string, key: string) => void
}

const CACHE_DURATION = 5 * 60 * 1000

function getCacheKey(accountId: string, bucket: string, prefix: string): string {
  return `${accountId}:${bucket}:${prefix}`
}

export const useBucketStore = create<BucketState>()((set, get) => ({
  bucketCache: null,
  objectsCache: new Map(),
  isLoadingBuckets: false,
  isLoadingObjects: false,
  error: null,

  loadBuckets: async (accountId: string, forceRefresh = false) => {
    const { bucketCache } = get()

    if (
      !forceRefresh &&
      bucketCache &&
      bucketCache.accountId === accountId &&
      Date.now() - bucketCache.timestamp < CACHE_DURATION
    ) {
      return bucketCache.buckets
    }

    set({ isLoadingBuckets: true, error: null })
    try {
      const result = await bucketService.listBuckets()
      const selectedBucket =
        bucketCache?.selectedBucket && result.find(b => b.name === bucketCache.selectedBucket)
          ? bucketCache.selectedBucket
          : result.length > 0
            ? result[0].name
            : null

      set({
        bucketCache: {
          accountId,
          buckets: result,
          selectedBucket,
          timestamp: Date.now(),
        },
        isLoadingBuckets: false,
      })
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '加载 Buckets 失败'
      set({
        error: `加载 Buckets 失败: ${errorMsg}`,
        isLoadingBuckets: false,
      })
      throw error
    }
  },

  loadObjects: async (accountId: string, bucket: string, prefix: string, forceRefresh = false) => {
    const { objectsCache, getCachedObjects } = get()
    const cacheKey = getCacheKey(accountId, bucket, prefix)

    if (!forceRefresh) {
      const cached = getCachedObjects(accountId, bucket, prefix)
      if (cached) {
        return cached
      }
    }

    set({ isLoadingObjects: true, error: null })
    try {
      const [objectsResult, multipartUploads] = await Promise.all([
        fileService.listObjects(bucket, prefix || undefined),
        fileService.listMultipartUploads(bucket, prefix || undefined),
      ])

      const multipartObjects: ObjectInfo[] = multipartUploads.map(upload => ({
        key: upload.key,
        size: 0,
        last_modified: upload.initiated,
        is_directory: false,
        is_uploading: true,
        upload_progress: 0,
        upload_speed: 0,
        upload_status: 'in_progress',
        upload_id: upload.upload_id,
      }))

      const allObjects = [...multipartObjects, ...objectsResult.objects]

      const newCache = new Map(objectsCache)
      newCache.set(cacheKey, {
        objects: allObjects,
        timestamp: Date.now(),
      })
      set({
        objectsCache: newCache,
        isLoadingObjects: false,
      })
      return allObjects
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '加载文件列表失败'
      set({
        error: `加载文件列表失败: ${errorMsg}`,
        isLoadingObjects: false,
      })
      throw error
    }
  },

  getCachedObjects: (accountId: string, bucket: string, prefix: string) => {
    const { objectsCache } = get()
    const cacheKey = getCacheKey(accountId, bucket, prefix)
    const cached = objectsCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.objects
    }

    return null
  },

  setSelectedBucket: (bucket: string | null) => {
    const { bucketCache } = get()
    if (bucketCache) {
      set({
        bucketCache: {
          ...bucketCache,
          selectedBucket: bucket,
        },
      })
    }
  },

  clearCache: () => {
    set({
      bucketCache: null,
      objectsCache: new Map(),
      error: null,
    })
  },

  addObjectToCache: (accountId: string, bucket: string, prefix: string, object: ObjectInfo) => {
    const { objectsCache } = get()
    const cacheKey = getCacheKey(accountId, bucket, prefix)
    const cached = objectsCache.get(cacheKey)

    if (cached) {
      // 检查是否已存在同名对象
      const exists = cached.objects.some(obj => obj.key === object.key)
      if (exists) return

      const newCache = new Map(objectsCache)
      newCache.set(cacheKey, {
        objects: [...cached.objects, object],
        timestamp: Date.now(),
      })
      set({ objectsCache: newCache })
    }
  },

  removeObjectFromCache: (accountId: string, bucket: string, prefix: string, key: string) => {
    const { objectsCache } = get()
    const cacheKey = getCacheKey(accountId, bucket, prefix)
    const cached = objectsCache.get(cacheKey)

    if (cached) {
      const newCache = new Map(objectsCache)
      newCache.set(cacheKey, {
        objects: cached.objects.filter(obj => obj.key !== key),
        timestamp: Date.now(),
      })
      set({ objectsCache: newCache })
    }
  },
}))
