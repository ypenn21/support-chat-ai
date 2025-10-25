/**
 * Background Service Worker (Manifest V3)
 * Entry point for the background context
 *
 * Responsibilities:
 * - Listen for messages from content scripts and popup
 * - Route messages to appropriate handlers
 * - Manage API communication
 * - Handle extension lifecycle events
 */

import { handleMessage } from './message-router'
import { createLogger } from '@/lib/logger'
import { setupGlobalErrorHandler } from '@/lib/error-handler'

const logger = createLogger('Background')

/**
 * Initialize background service worker
 */
function initialize(): void {
  logger.info('Background service worker initializing...')

  // Setup global error handler
  setupGlobalErrorHandler()

  // Set up message listener
  chrome.runtime.onMessage.addListener(handleMessage)

  logger.info('Background service worker initialized successfully')
}

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed:', details.reason)

  if (details.reason === 'install') {
    logger.info('First-time installation')
    // Could set default preferences here
  } else if (details.reason === 'update') {
    logger.info('Extension updated to version:', chrome.runtime.getManifest().version)
  }
})

/**
 * Handle service worker startup
 */
chrome.runtime.onStartup.addListener(() => {
  logger.info('Browser started, service worker waking up')
})

// Initialize the service worker
initialize()

// Export for testing
export { initialize }
