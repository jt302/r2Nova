import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Folder,
  File,
  Download,
  Trash2,
  RefreshCw,
  Upload,
  X,
  ArrowUp,
  FolderPlus,
} from 'lucide-react'
import { listen } from '@tauri-apps/api/event'
import { Account, ObjectInfo } from '../types'
import { fileService } from '../services/r2Service'
import { dialogService } from '../services/dialogService'
import { useBucketStore } from '../stores/bucketStore'
import { useTransferStore } from '../stores/transferStore'
import { useTranslation } from '../stores/i18nStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface BucketBrowserProps {
  account: Account
  selectedBucket: string | null
  onBucketSelect: (bucketName: string) => void
}

export function BucketBrowser({ account, selectedBucket, onBucketSelect }: BucketBrowserProps) {
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const { t } = useTranslation()
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [folderNameInput, setFolderNameInput] = useState('')
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false)
  const [folderContentsToDelete, setFolderContentsToDelete] = useState<ObjectInfo[]>([])
  const [folderToDeleteKey, setFolderToDeleteKey] = useState('')
  const [isLoadingFolderContents, setIsLoadingFolderContents] = useState(false)
  const [hasMoreContents, setHasMoreContents] = useState(false)
  const [totalContentsCount, setTotalContentsCount] = useState(0)
  const [deleteProgress, setDeleteProgress] = useState<{
    key: string
    deleted: number
    total: number
  } | null>(null)
  const [isDeleteFileDialogOpen, setIsDeleteFileDialogOpen] = useState(false)
  const [fileToDeleteKey, setFileToDeleteKey] = useState('')

  const {
    bucketCache,
    isLoadingBuckets,
    isLoadingObjects,
    error: storeError,
    loadBuckets,
    loadObjects,
    getCachedObjects,
    setSelectedBucket,
    addObjectToCache,
    removeObjectFromCache,
  } = useBucketStore()

  const loadedRef = useRef<{ buckets: boolean; objects: boolean }>({
    buckets: false,
    objects: false,
  })

  useEffect(() => {
    loadedRef.current = { buckets: false, objects: false }
  }, [account.id])

  useEffect(() => {
    if (!loadedRef.current.buckets) {
      loadedRef.current.buckets = true
      loadBuckets(account.id).then(buckets => {
        const currentSelected =
          selectedBucket && buckets.find(b => b.name === selectedBucket)
            ? selectedBucket
            : buckets.length > 0
              ? buckets[0].name
              : null

        if (currentSelected && currentSelected !== selectedBucket) {
          onBucketSelect(currentSelected)
        }
      })
    }
  }, [account.id, loadBuckets, selectedBucket, onBucketSelect])

  useEffect(() => {
    if (selectedBucket && !loadedRef.current.objects) {
      loadedRef.current.objects = true
      loadObjects(account.id, selectedBucket, currentPrefix)
    }
  }, [account.id, selectedBucket, currentPrefix, loadObjects])

  useEffect(() => {
    if (selectedBucket) {
      setSelectedBucket(selectedBucket)
    }
  }, [selectedBucket, setSelectedBucket])

  useEffect(() => {
    loadedRef.current.objects = false
  }, [selectedBucket, currentPrefix])

  useEffect(() => {
    useTransferStore.getState().setOnUploadCompleted((bucket: string, key: string) => {
      if (bucket === selectedBucket && key.startsWith(currentPrefix)) {
        // 上传完成后只把新文件追加进缓存，避免整个列表刷新
        const task = useTransferStore.getState().tasks.find(
          t => t.key === key && t.bucket === bucket
        )
        addObjectToCache(account.id, bucket, currentPrefix, {
          key,
          size: task?.bytesTotal || 0,
          last_modified: new Date().toISOString(),
          is_directory: false,
        })
      }
    })

    return () => {
      useTransferStore.getState().setOnUploadCompleted(null)
    }
  }, [selectedBucket, currentPrefix, account.id, addObjectToCache])

  useEffect(() => {
    const unlisten = listen<{ bucket: string; key: string; deleted: number; total: number }>(
      'delete-progress',
      event => {
        const { key, deleted, total } = event.payload
        setDeleteProgress({ key, deleted, total })
      }
    )

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  const handleRefresh = () => {
    loadedRef.current = { buckets: true, objects: true }
    loadBuckets(account.id, true)
    if (selectedBucket) {
      loadObjects(account.id, selectedBucket, currentPrefix, true)
    }
  }

  const handleBucketClick = (bucketName: string) => {
    if (bucketName !== selectedBucket) {
      loadedRef.current.objects = false
      setCurrentPrefix('')
      onBucketSelect(bucketName)
    }
  }

  const handleObjectClick = (obj: ObjectInfo) => {
    if (obj.is_directory) {
      loadedRef.current.objects = false
      setCurrentPrefix(obj.key)
    }
  }

  const getBreadcrumbParts = () => {
    if (!currentPrefix) return []
    return currentPrefix.split('/').filter(Boolean)
  }

  const handleBreadcrumbClick = (index: number) => {
    const parts = getBreadcrumbParts()
    const newPrefix = index === -1 ? '' : parts.slice(0, index + 1).join('/') + '/'
    loadedRef.current.objects = false
    setCurrentPrefix(newPrefix)
  }

  const handleNavigateUp = () => {
    if (!currentPrefix) return
    const parts = currentPrefix.split('/').filter(Boolean)
    parts.pop()
    loadedRef.current.objects = false
    setCurrentPrefix(parts.length > 0 ? parts.join('/') + '/' : '')
  }

  const handleCreateFolder = () => {
    if (!selectedBucket) return
    setFolderNameInput('')
    setIsFolderDialogOpen(true)
  }

  const handleConfirmCreateFolder = async () => {
    if (!selectedBucket || !folderNameInput.trim()) return

    const folderName = folderNameInput.trim()

    if (folderName.includes('/') || folderName.includes('\\')) {
      setLocalError(t('bucket.folderInvalid'))
      return
    }

    const key = currentPrefix + folderName + '/'

    setCreatingFolder(true)
    setLocalError(null)
    setIsFolderDialogOpen(false)
    try {
      await fileService.createFolder(selectedBucket, folderName)
      addObjectToCache(account.id, selectedBucket, currentPrefix, {
        key: key,
        size: 0,
        last_modified: new Date().toISOString(),
        is_directory: true,
      })
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('bucket.createError'))
    } finally {
      setCreatingFolder(false)
      setFolderNameInput('')
    }
  }

  const handleDelete = async (key: string, isDirectory?: boolean) => {
    if (!selectedBucket) return

    if (isDirectory) {
      await showDeleteFolderPreview(key)
    } else {
      setFileToDeleteKey(key)
      setIsDeleteFileDialogOpen(true)
    }
  }

  const handleConfirmDeleteFile = async () => {
    if (!selectedBucket || !fileToDeleteKey) return

    setIsDeleteFileDialogOpen(false)
    try {
      await fileService.deleteObject(selectedBucket, fileToDeleteKey)
      removeObjectFromCache(account.id, selectedBucket, currentPrefix, fileToDeleteKey)
      setFileToDeleteKey('')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('bucket.deleteError'))
    }
  }

  const showDeleteFolderPreview = async (key: string) => {
    if (!selectedBucket) return

    setFolderToDeleteKey(key)
    setIsLoadingFolderContents(true)
    setFolderContentsToDelete([])
    setHasMoreContents(false)
    setTotalContentsCount(0)

    try {
      const result = await fileService.previewFolderContents(selectedBucket, key, 100)

      if (result.total_count === 0) {
        setIsLoadingFolderContents(false)
        await performDeleteFolder(key)
        return
      }

      setFolderContentsToDelete(result.objects)
      setHasMoreContents(result.has_more)
      setTotalContentsCount(result.total_count)
      setIsDeleteFolderDialogOpen(true)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('error.loadFolderFailed'))
    } finally {
      setIsLoadingFolderContents(false)
    }
  }

  const performDeleteFolder = async (key: string) => {
    if (!selectedBucket) return

    setDeleteProgress({ key, deleted: 0, total: 0 })

    try {
      await fileService.deleteFolder(selectedBucket, key)
      removeObjectFromCache(account.id, selectedBucket, currentPrefix, key)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('bucket.deleteError'))
    } finally {
      setTimeout(() => setDeleteProgress(null), 2000)
    }
  }

  const handleConfirmDeleteFolder = async () => {
    if (!selectedBucket || !folderToDeleteKey) return

    setIsDeleteFolderDialogOpen(false)
    await performDeleteFolder(folderToDeleteKey)
    setFolderContentsToDelete([])
    setFolderToDeleteKey('')
  }

  const handleUpload = async () => {
    if (!selectedBucket) return

    const filePath = await dialogService.selectFile()
    if (!filePath) return

    const fileName = filePath.split('/').pop() || t('common.unnamed')
    const key = currentPrefix + fileName

    setUploading(true)
    setLocalError(null)
    try {
      const taskId = await fileService.uploadFile(selectedBucket, key, filePath)
      // 将任务加入 store，文件立即以"上传中"状态显示在列表里，无需刷新整个列表
      addTask({
        id: taskId,
        type: 'upload',
        status: 'pending',
        filename: fileName,
        bucket: selectedBucket,
        key,
        bytesTotal: 0,
        bytesTransferred: 0,
        speedMbps: 0,
      })
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('bucket.uploadError'))
    } finally {
      setUploading(false)
    }
  }

  const addTask = useTransferStore(state => state.addTask)

  const handleDownload = async (obj: ObjectInfo) => {
    if (!selectedBucket || obj.is_directory) return

    const savePath = await dialogService.saveFile(obj.key.split('/').pop())
    if (!savePath) return

    setLocalError(null)
    try {
      // Start download - returns immediately with task_id, download runs in background
      const taskId = await fileService.downloadFile(selectedBucket, obj.key, savePath)

      // Add task to store for tracking in TransferCenter
      addTask({
        id: taskId,
        type: 'download',
        status: 'in_progress',
        filename: obj.key.split('/').pop() || obj.key,
        bucket: selectedBucket,
        key: obj.key,
        bytesTotal: obj.size,
        bytesTransferred: 0,
        speedMbps: 0,
      })

      // Show brief feedback then clear the downloading state
      setDownloading(obj.key)
      setTimeout(() => setDownloading(null), 500)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('bucket.downloadError'))
      setDownloading(null)
    }
  }

  const handleCancelUpload = async (obj: ObjectInfo) => {
    if (!selectedBucket || !obj.upload_id) return

    setLocalError(null)
    try {
      await fileService.abortMultipartUpload(selectedBucket, obj.key, obj.upload_id)
      loadedRef.current.objects = false
      await loadObjects(account.id, selectedBucket, currentPrefix, true)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('bucket.cancelUploadError'))
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const buckets = bucketCache?.buckets || []
  const objects = getCachedObjects(account.id, selectedBucket || '', currentPrefix) || []
  const error = localError || storeError
  const isLoading = isLoadingBuckets || isLoadingObjects

  const tasks = useTransferStore(state => state.tasks)
  const uploadingTasks = useMemo(() => {
    if (!selectedBucket) return []
    const filtered = tasks.filter(
      task =>
        task.type === 'upload' &&
        task.bucket === selectedBucket &&
        task.key.startsWith(currentPrefix) &&
        (task.status === 'pending' || task.status === 'in_progress')
    )
    return filtered
  }, [tasks, selectedBucket, currentPrefix])

  const displayObjects = useMemo(() => {
    if (uploadingTasks.length === 0) return objects

    const uploadingObjects: ObjectInfo[] = uploadingTasks.map(task => ({
      key: task.key,
      size: task.bytesTotal,
      last_modified: new Date().toISOString(),
      is_directory: false,
      is_uploading: true,
      upload_progress: task.bytesTotal > 0 ? (task.bytesTransferred / task.bytesTotal) * 100 : 0,
      upload_speed: task.speedMbps,
      upload_status: task.status,
    }))

    const existingKeys = new Set(uploadingObjects.map(obj => obj.key))
    const filteredObjects = objects.filter(obj => !existingKeys.has(obj.key))

    return [...uploadingObjects, ...filteredObjects]
  }, [objects, uploadingTasks])

  return (
    <div className="flex h-full">
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold">{t('bucket.title')}</h3>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {buckets.map(bucket => (
            <Button
              key={bucket.name}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2',
                selectedBucket === bucket.name
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => handleBucketClick(bucket.name)}
            >
              <Folder
                className="w-5 h-5"
                fill={selectedBucket === bucket.name ? 'currentColor' : 'none'}
              />
              <span className="text-sm font-medium truncate">{bucket.name}</span>
            </Button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <Breadcrumb>
            <BreadcrumbList>
              {selectedBucket && (
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => handleBreadcrumbClick(-1)}>
                    {selectedBucket}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {getBreadcrumbParts().map((part, index) => (
                <BreadcrumbItem key={index}>
                  <BreadcrumbSeparator />
                  <BreadcrumbLink onClick={() => handleBreadcrumbClick(index)}>
                    {part}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            {currentPrefix && (
              <Button variant="outline" size="sm" onClick={handleNavigateUp}>
                <ArrowUp className="w-4 h-4 mr-2" />
                {t('bucket.parent')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateFolder}
              disabled={creatingFolder || !selectedBucket}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              {creatingFolder ? t('bucket.creating') : t('bucket.newFolder')}
            </Button>
            <Button size="sm" onClick={handleUpload} disabled={uploading || !selectedBucket}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? t('bucket.uploading') : t('bucket.upload')}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {deleteProgress && (
          <Alert className="m-4">
            <AlertDescription className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{t('bucket.deleting')}</div>
                <div className="text-muted-foreground text-sm">
                  {deleteProgress.total > 0
                    ? t('bucket.deleteProgress')
                        .replace('{current}', deleteProgress.deleted.toString())
                        .replace('{total}', deleteProgress.total.toString())
                    : deleteProgress.key.split('/').filter(Boolean).pop()}
                </div>
              </div>
              <Progress
                value={
                  deleteProgress.total > 0
                    ? (deleteProgress.deleted / deleteProgress.total) * 100
                    : 0
                }
                className="w-32 h-2"
              />
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {t('bucket.loading')}
          </div>
        ) : displayObjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Folder size={48} className="mb-4 opacity-20" />
            <p>{t('bucket.empty')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('bucket.name')}</TableHead>
                <TableHead className="w-[120px]">{t('bucket.size')}</TableHead>
                <TableHead className="w-[100px] text-right">{t('bucket.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayObjects.map(obj => {
                const isUploading = obj.is_uploading === true
                const uploadProgress = obj.upload_progress || 0
                const uploadSpeed = obj.upload_speed || 0

                return (
                  <TableRow
                    key={obj.key}
                    className={cn(isUploading && 'bg-primary/5')}
                    onClick={() => !isUploading && handleObjectClick(obj)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          {obj.is_directory ? (
                            <Folder size={18} />
                          ) : isUploading ? (
                            <Upload size={18} className="text-primary" />
                          ) : (
                            <File size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={cn('font-medium', obj.is_directory && 'font-semibold')}>
                            {obj.is_directory
                              ? obj.key.replace(/\/$/, '').split('/').pop()
                              : obj.key.split('/').pop()}
                          </span>
                          {isUploading && (
                            <div className="mt-1">
                              <Progress value={uploadProgress} className="h-1 w-32" />
                              <span className="text-xs text-muted-foreground">
                                {uploadProgress.toFixed(0)}% · {uploadSpeed.toFixed(1)} MB/s
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {!obj.is_directory && !isUploading && formatSize(obj.size)}
                      {isUploading && (
                        <span className="text-primary text-sm">{t('transfer.uploading')}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!obj.is_directory && !isUploading ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => {
                              e.stopPropagation()
                              handleDownload(obj)
                            }}
                            disabled={downloading === obj.key}
                          >
                            {downloading === obj.key ? (
                              <span className="text-xs">{t('common.loadingDots')}</span>
                            ) : (
                              <Download size={14} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={e => {
                              e.stopPropagation()
                              handleDelete(obj.key, obj.is_directory)
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ) : isUploading ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={e => {
                            e.stopPropagation()
                            handleCancelUpload(obj)
                          }}
                        >
                          <X size={14} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={e => {
                            e.stopPropagation()
                            handleDelete(obj.key, obj.is_directory)
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </main>

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.newFolder')}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t('dialog.folderName')}
            value={folderNameInput}
            onChange={e => setFolderNameInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleConfirmCreateFolder()
              } else if (e.key === 'Escape') {
                setIsFolderDialogOpen(false)
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirmCreateFolder}
              disabled={!folderNameInput.trim() || creatingFolder}
            >
              {creatingFolder ? t('dialog.creating') : t('dialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteFolderDialogOpen} onOpenChange={setIsDeleteFolderDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t('dialog.deleteFolder')}</DialogTitle>
            <DialogDescription>
              {t('dialog.deleteWarning').replace('{folder}', folderToDeleteKey)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto py-4">
            {isLoadingFolderContents ? (
              <div className="text-center text-muted-foreground py-4">
                {t('dialog.loadingContents')}
              </div>
            ) : (
              <>
                <div className="mb-2 text-sm font-medium">
                  {t('dialog.itemsToDelete').replace('{count}', totalContentsCount.toString())}
                  {hasMoreContents ? '+' : ''}
                </div>
                <div className="border rounded-md p-2 space-y-1 max-h-48 overflow-y-auto">
                  {folderContentsToDelete.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      {t('dialog.emptyFolder')}
                    </div>
                  ) : (
                    folderContentsToDelete.map((obj, _index) => (
                      <div
                        key={obj.key}
                        className="flex items-center gap-2 py-1 text-sm border-b last:border-0"
                      >
                        {obj.is_directory ? <Folder size={14} /> : <File size={14} />}
                        <span className="flex-1 truncate">
                          {obj.key.replace(folderToDeleteKey, '') || obj.key}
                        </span>
                        {!obj.is_directory && (
                          <span className="text-muted-foreground text-xs">
                            {formatSize(obj.size)}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                  {hasMoreContents && (
                    <div className="text-center text-xs text-muted-foreground py-2 border-t">
                      {t('dialog.moreContents')}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteFolderDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteFolder}
              disabled={isLoadingFolderContents}
            >
              {t('dialog.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteFileDialogOpen} onOpenChange={setIsDeleteFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{t('dialog.deleteFile')}</DialogTitle>
            <DialogDescription>
              {t('dialog.deleteFileConfirm').replace(
                '{filename}',
                fileToDeleteKey.split('/').pop() || ''
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteFileDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteFile}>
              {t('dialog.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
