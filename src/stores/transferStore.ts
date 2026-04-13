import { create } from 'zustand'
import { listen } from '@tauri-apps/api/event'
import { logger } from '../services/loggerService'

export interface TransferTask {
  id: string
  type: 'upload' | 'download'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  filename: string
  bucket: string
  key: string
  bytesTotal: number
  bytesTransferred: number
  speedMbps: number
}

interface TransferProgressPayload {
  task_id: string
  transfer_type: string
  filename: string
  bucket: string
  key: string
  bytes_transferred: number
  bytes_total: number
  speed_mbps: number
  status: string
}

interface TransferCompletedPayload {
  task_id: string
  bucket: string
  key: string
  transfer_type: string
}

interface TransferFailedPayload {
  task_id: string
  error: string
}

interface TransferStore {
  tasks: TransferTask[]
  addTask: (task: TransferTask) => void
  updateProgress: (taskId: string, bytesTransferred: number, bytesTotal: number, speedMbps: number) => void
  completeTask: (taskId: string) => void
  failTask: (taskId: string, error: string) => void
  removeTask: (taskId: string) => void
  clearCompleted: () => void
  // 获取特定 bucket 和 prefix 的上传任务（用于文件列表显示）
  getUploadTasksForPrefix: () => TransferTask[]
  // 文件列表刷新回调
  onUploadCompleted: ((bucket: string, key: string) => void) | null
  setOnUploadCompleted: (callback: ((bucket: string, key: string) => void) | null) => void
}

export const useTransferStore = create<TransferStore>(set => ({
  tasks: [],
  onUploadCompleted: null,

  addTask: task =>
    set(state => ({
      tasks: [...state.tasks, task],
    })),

  updateProgress: (taskId, bytesTransferred, bytesTotal, speedMbps) =>
    set(state => ({
      tasks: state.tasks.map(task =>
        // 只更新进行中的任务，防止迟到的 progress 事件将 completed/failed 状态覆盖
        task.id === taskId && task.status !== 'completed' && task.status !== 'failed'
          ? { ...task, bytesTransferred, bytesTotal, speedMbps, status: 'in_progress' }
          : task
      ),
    })),

  completeTask: taskId =>
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: 'completed', bytesTransferred: task.bytesTotal }
          : task
      ),
    })),

  failTask: taskId =>
    set(state => ({
      tasks: state.tasks.map(task => (task.id === taskId ? { ...task, status: 'failed' } : task)),
    })),

  removeTask: taskId =>
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== taskId),
    })),

  clearCompleted: () =>
    set(state => ({
      tasks: state.tasks.filter(task => task.status !== 'completed'),
    })),

  getUploadTasksForPrefix: (): TransferTask[] => {
    return []
  },

  setOnUploadCompleted: callback =>
    set(() => ({
      onUploadCompleted: callback,
    })),
}))

let listenersInitialized = false

export function initTransferListeners() {
  if (listenersInitialized) return
  listenersInitialized = true

  logger.info('[Transfer] Initializing transfer event listeners')

  listen<TransferProgressPayload>('transfer-progress', event => {
    logger.debug('[Transfer] Progress event received', { taskId: event.payload.task_id })
    const payload = event.payload
    const store = useTransferStore.getState()

    const existingTask = store.tasks.find(t => t.id === payload.task_id)
    if (!existingTask) {
      store.addTask({
        id: payload.task_id,
        type: payload.transfer_type as 'upload' | 'download',
        status: payload.status as TransferTask['status'],
        filename: payload.filename,
        bucket: payload.bucket,
        key: payload.key,
        bytesTotal: payload.bytes_total,
        bytesTransferred: payload.bytes_transferred,
        speedMbps: payload.speed_mbps,
      })
    } else {
      store.updateProgress(payload.task_id, payload.bytes_transferred, payload.bytes_total, payload.speed_mbps)
    }
  })

  listen<TransferCompletedPayload>('transfer-completed', event => {
    logger.info('[Transfer] Completed event received', {
      taskId: event.payload.task_id,
      bucket: event.payload.bucket,
    })
    const { task_id, bucket, key, transfer_type } = event.payload
    useTransferStore.getState().completeTask(task_id)

    // 如果是上传完成，触发刷新回调
    if (transfer_type === 'upload') {
      const callback = useTransferStore.getState().onUploadCompleted
      if (callback) {
        callback(bucket, key)
      }
    }

    setTimeout(() => {
      useTransferStore.getState().removeTask(task_id)
    }, 3000)
  })

  listen<TransferFailedPayload>('transfer-failed', event => {
    logger.error('[Transfer] Failed event received', {
      taskId: event.payload.task_id,
      error: event.payload.error,
    })
    const { task_id, error } = event.payload
    useTransferStore.getState().failTask(task_id, error)

    setTimeout(() => {
      useTransferStore.getState().removeTask(task_id)
    }, 5000)
  })
}
