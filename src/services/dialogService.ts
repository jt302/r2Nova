import { open, save } from '@tauri-apps/plugin-dialog'
import { logger } from './loggerService'

export const dialogService = {
  async selectFile(): Promise<string | null> {
    const file = await open({
      multiple: false,
      directory: false,
    })
    return file as string | null
  },

  async selectFiles(): Promise<string[] | null> {
    const files = await open({
      multiple: true,
      directory: false,
    })
    return files as string[] | null
  },

  async selectDirectory(): Promise<string | null> {
    const dir = await open({
      multiple: false,
      directory: true,
    })
    return dir as string | null
  },

  async saveFile(defaultName?: string): Promise<string | null> {
    try {
      // 清理文件名：移除可能导致问题的字符
      const safeName = defaultName
        ? defaultName.replace(/[\\/:*?"<>|]/g, '_').substring(0, 255)
        : undefined

      const path = await save({
        defaultPath: safeName,
      })
      return path
    } catch (error) {
      logger.error('Save dialog error', { error: String(error) })
      return null
    }
  },
}
