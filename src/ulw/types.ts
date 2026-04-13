// ULW (Ultra Work) Framework - Type Definitions
// A lightweight module system for organizing and managing application modules

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  context?: string
  data?: Record<string, unknown>
}

export interface ILogger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
}

export interface IModule {
  name: string
  version: string
  dependencies?: string[]
  init(): Promise<void> | void
  start(): Promise<void> | void
  stop(): Promise<void> | void
}

export interface ModuleConfig {
  name: string
  enabled?: boolean
  config?: Record<string, unknown>
}

export interface IModuleManager {
  register(module: IModule): void
  unregister(name: string): void
  get<T extends IModule>(name: string): T | undefined
  initAll(): Promise<void>
  startAll(): Promise<void>
  stopAll(): Promise<void>
}
