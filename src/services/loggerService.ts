import type { ILogger, LogLevel, IModule } from '../ulw'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  context?: string
  data?: Record<string, unknown>
}

export interface LogAppender {
  append(entry: LogEntry): void
}

class ConsoleAppender implements LogAppender {
  append(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''}`

    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data || '')
        break
      case 'info':
        console.info(prefix, entry.message, entry.data || '')
        break
      case 'warn':
        console.warn(prefix, entry.message, entry.data || '')
        break
      case 'error':
        console.error(prefix, entry.message, entry.data || '')
        break
    }
  }
}

class LoggerService implements ILogger, IModule {
  name = 'logger'
  version = '1.0.0'

  private appenders: LogAppender[] = []
  private minLevel: LogLevel = 'debug'
  private context?: string

  constructor() {
    this.appenders.push(new ConsoleAppender())
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  setContext(context: string): void {
    this.context = context
  }

  addAppender(appender: LogAppender): void {
    this.appenders.push(appender)
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const minIndex = levels.indexOf(this.minLevel)
    const currentIndex = levels.indexOf(level)
    return currentIndex >= minIndex
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context: this.context,
      data,
    }

    this.appenders.forEach(appender => {
      try {
        appender.append(entry)
      } catch {
        // Prevent logging failures from breaking the app
      }
    })
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data)
  }

  // IModule lifecycle methods
  async init(): Promise<void> {
    this.info('Logger service initialized')
  }

  async start(): Promise<void> {
    this.info('Logger service started')
  }

  async stop(): Promise<void> {
    this.info('Logger service stopped')
    this.appenders.length = 0
  }
}

export const loggerService = new LoggerService()

export const logger: ILogger = loggerService
