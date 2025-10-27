/**
 * Content Script Entry Point
 * Injected into support chat pages to provide AI assistance
 *
 * Responsibilities:
 * - Detect platform (Zendesk, Intercom, etc.)
 * - Observe DOM for new messages
 * - Request suggestions from background worker
 * - Inject UI components into the page
 */

import { waitForPlatform, detectPlatformType } from './platforms'
import { createChatObserver, waitForChatContainer } from './dom-observer'
import type { Message, SuggestResponse } from '@/types'
import {
  mountSuggestionPanel,
  showLoadingPanel,
  showErrorPanel,
  unmountSuggestionPanel
} from './ui-injector'
import { createLogger } from '@/lib/logger'
import { setupGlobalErrorHandler } from '@/lib/error-handler'
import { getMode } from '@/lib/storage'

const logger = createLogger('Content Script')

// Global state
let cleanupObserver: (() => void) | null = null
let currentMode: 'suggestion' | 'yolo' = 'suggestion'

/**
 * Initialize content script
 */
async function initialize(): Promise<void> {
  logger.info('Content script initializing...')

  // Setup global error handler
  setupGlobalErrorHandler()

  // Get current mode from storage
  currentMode = await getMode()
  logger.info(`Operating in ${currentMode} mode`)

  // Wait for platform to load (with 10 second timeout)
  logger.info('Waiting for chat platform to load...')
  const platform = await waitForPlatform(10000)

  if (!platform) {
    logger.warn('No supported chat platform detected. Extension will not activate.')
    return
  }

  const platformType = platform.getPlatformName()
  logger.info(`Platform detected: ${platformType}`)

  // Wait for chat container to appear
  logger.info('Waiting for chat container...')
  const container = await waitForChatContainer(platform, 10000)

  if (!container) {
    logger.error('Chat container not found. Cannot observe messages.')
    return
  }

  logger.info('Chat container found, starting observer...')

  // Start observing for new messages
  cleanupObserver = createChatObserver(platform, handleNewMessages, {
    debounceDelay: 500,
    onlyCustomerMessages: false, // Trigger on all new messages
    mode: currentMode
  })

  logger.info('Content script initialized successfully')
}

/**
 * Handle new messages detected in the chat
 */
async function handleNewMessages(messages: Message[]): Promise<void> {
  logger.info('New messages detected, handling...')

  if (currentMode === 'suggestion') {
    await handleSuggestionMode(messages)
  } else if (currentMode === 'yolo') {
    // YOLO mode not yet implemented in Phase 1
    logger.info('YOLO mode detected, but not yet implemented in Phase 1')
  }
}

/**
 * Handle Suggestion Mode
 * Request suggestion and display UI panel
 */
async function handleSuggestionMode(messages: Message[]): Promise<void> {
  logger.info('Handling Suggestion Mode')

  // Show loading panel
  const cleanup = showLoadingPanel()

  try {
    // Get the platform type for the request
    const platformType = detectPlatformType()

    // Request suggestion from background worker
    logger.info('Requesting suggestion from background worker...')

    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
    })

    const messagePromise = chrome.runtime.sendMessage({
      type: 'GET_SUGGESTION',
      payload: {
        platform: platformType,
        conversation_context: messages.slice(-10) // Last 10 messages
      }
    })

    const response: SuggestResponse = await Promise.race([messagePromise, timeoutPromise])

    logger.info('Received response from background worker')
    // DEBUG: Log the actual response structure
    console.log('🔍 DEBUG: Full response object:', response)
    console.log('🔍 DEBUG: response.suggestions:', response?.suggestions)
    console.log('🔍 DEBUG: typeof response:', typeof response)

    // Remove loading panel
    cleanup()

    // Check if response is undefined (service worker not responding)
    if (!response) {
      logger.error('No response from background worker')
      showErrorPanel('Extension service worker not responding. Try reloading the extension.')
      return
    }

    // Check for error
    if ('error' in response) {
      logger.error('Error from background worker:', response.error)
      showErrorPanel(String(response.error))
      return
    }

    // Display suggestion
    if (response.suggestions && response.suggestions.length > 0) {
      const suggestion = response.suggestions[0]
      logger.info('Displaying suggestion:', suggestion.id)

      mountSuggestionPanel(suggestion, {
        onCopy: () => {
          logger.info('User copied suggestion')
          // Optional: track analytics
        },
        onDismiss: () => {
          logger.info('User dismissed suggestion')
          unmountSuggestionPanel()
        },
        position: 'bottom-right'
      })
    } else {
      logger.warn('No suggestions returned')
      showErrorPanel('No suggestions available at this time')
    }
  } catch (error) {
    logger.error('Failed to get suggestion:', error)
    cleanup()
    showErrorPanel('Failed to get AI suggestion. Please try again.')
  }
}

/**
 * Handle mode changes from popup/background
 */
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'MODE_CHANGED') {
    const newMode = message.payload?.mode
    if (newMode) {
      logger.info(`Mode changed to: ${newMode}`)
      currentMode = newMode

      // Reinitialize observer with new mode
      if (cleanupObserver) {
        cleanupObserver()
      }
      initialize()
    }
  }
})

/**
 * Cleanup on unload
 */
window.addEventListener('beforeunload', () => {
  logger.info('Page unloading, cleaning up...')
  if (cleanupObserver) {
    cleanupObserver()
  }
  unmountSuggestionPanel()
})

// Start initialization
initialize().catch((error) => {
  logger.error('Failed to initialize content script:', error)
})
