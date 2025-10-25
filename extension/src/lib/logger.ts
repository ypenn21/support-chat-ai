/**
 * Logger Utility
 * Provides consistent logging with different severity levels
 * Respects debug mode from environment variables
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

/**
 * Format log message with timestamp and context
 */
function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`
}

/**
 * Logger class with context
 */
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  /**
   * Debug-level logging (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (isDevelopment()) {
      console.log(formatMessage('debug', this.context, message), ...args)
    }
  }

  /**
   * Info-level logging
   */
  info(message: string, ...args: any[]): void {
    console.log(formatMessage('info', this.context, message), ...args)
  }

  /**
   * Warning-level logging
   */
  warn(message: string, ...args: any[]): void {
    console.warn(formatMessage('warn', this.context, message), ...args)
  }

  /**
   * Error-level logging
   */
  error(message: string, error?: Error | unknown, ...args: any[]): void {
    console.error(formatMessage('error', this.context, message), error, ...args)
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, ...args: any[]): void {
    switch (level) {
      case 'debug':
        this.debug(message, ...args)
        break
      case 'info':
        this.info(message, ...args)
        break
      case 'warn':
        this.warn(message, ...args)
        break
      case 'error':
        this.error(message, ...args)
        break
    }
  }
}

/**
 * Create a logger instance with context
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * Default logger for backward compatibility
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment()) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args)
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },
  error: (message: string, error?: Error | unknown) => {
    console.error(`[ERROR] ${message}`, error)
  }
}
