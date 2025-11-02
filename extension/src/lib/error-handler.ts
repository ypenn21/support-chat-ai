import { logger } from './logger'

/**
 * Error Handler Utility
 * Provides consistent error handling across the extension
 */

/**
 * Custom error types for better error handling
 */
export class ExtensionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'ExtensionError'
  }
}

export class PlatformError extends ExtensionError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PLATFORM_ERROR', context)
    this.name = 'PlatformError'
  }
}

export class APIError extends ExtensionError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'API_ERROR', context)
    this.name = 'APIError'
  }
}

export class StorageError extends ExtensionError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'STORAGE_ERROR', context)
    this.name = 'StorageError'
  }
}

/**
 * Global error handler for uncaught errors
 * Works in both browser context (content scripts, popup) and service worker context (background)
 */
export function setupGlobalErrorHandler(): void {
  // Check if we're in a browser context (window exists) or service worker context
  if (typeof window === 'undefined') {
    // Service worker context - use self instead of window
    self.addEventListener('error', (event) => {
      logger.error('Uncaught error in service worker:', event.error || event)
    })

    self.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection in service worker:', event.reason)
    })
  } else {
    // Browser context (content scripts, popup, options) - use window
    window.addEventListener('error', (event) => {
      logger.error('Uncaught error:', event.error)
      // Prevent default error handling
      event.preventDefault()
    })

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection:', event.reason)
      // Prevent default error handling
      event.preventDefault()
    })
  }
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      logger.error(`Error in ${context}:`, error)
      throw error
    }
  }) as T
}

/**
 * Safe function execution with fallback
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (context) {
      logger.error(`Error in ${context}, using fallback:`, error)
    } else {
      logger.error('Error during execution, using fallback:', error)
    }
    return fallback
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options

  let lastError: Error | unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      logger.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error)

      if (attempt < maxRetries - 1) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        )
        logger.info(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof ExtensionError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred. Please try again.'
}
