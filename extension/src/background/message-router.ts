import type { RuntimeMessage, SuggestRequest, UserPreferences } from '@/types'
import { fetchSuggestion, validateSuggestionRequest } from './api-client'
import { getPreferences, savePreferences } from '@/lib/storage'
import { createLogger } from '@/lib/logger'
import { formatErrorForUser } from '@/lib/error-handler'

const logger = createLogger('Message Router')

/**
 * Message Router for Background Service Worker
 * Routes messages between different extension contexts
 */

/**
 * Handle GET_SUGGESTION message
 */
async function handleGetSuggestion(payload: any): Promise<any> {
  logger.info('Handling GET_SUGGESTION request')

  // Validate request
  if (!validateSuggestionRequest(payload)) {
    return {
      error: 'Invalid suggestion request format'
    }
  }

  const request = payload as SuggestRequest

  try {
    // Get user preferences to include in request
    const preferences = await getPreferences()

    if (preferences) {
      request.user_preferences = preferences
      logger.debug('Including user preferences in request')
    }

    // Fetch suggestion from API
    const response = await fetchSuggestion(request)

    logger.info('Successfully fetched suggestion')
    return response
  } catch (error) {
    logger.error('Failed to get suggestion:', error)
    return {
      error: formatErrorForUser(error)
    }
  }
}

/**
 * Handle SAVE_PREFERENCES message
 */
async function handleSavePreferences(payload: any): Promise<any> {
  logger.info('Handling SAVE_PREFERENCES request')

  try {
    const preferences = payload as UserPreferences

    await savePreferences(preferences)

    logger.info('Successfully saved preferences')
    return { success: true }
  } catch (error) {
    logger.error('Failed to save preferences:', error)
    return {
      error: formatErrorForUser(error)
    }
  }
}

/**
 * Handle GET_PREFERENCES message
 */
async function handleGetPreferences(): Promise<any> {
  logger.info('Handling GET_PREFERENCES request')

  try {
    const preferences = await getPreferences()

    logger.info('Successfully retrieved preferences')
    return { preferences }
  } catch (error) {
    logger.error('Failed to get preferences:', error)
    return {
      error: formatErrorForUser(error)
    }
  }
}

/**
 * Main message handler
 * Dispatches messages to appropriate handlers
 */
export function handleMessage(
  message: RuntimeMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  logger.debug('Received message:', message.type)

  // Handle different message types
  switch (message.type) {
    case 'GET_SUGGESTION':
      handleGetSuggestion(message.payload)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling GET_SUGGESTION:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true // Required for async response

    case 'SAVE_PREFERENCES':
      handleSavePreferences(message.payload)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling SAVE_PREFERENCES:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true

    case 'GET_PREFERENCES':
      handleGetPreferences()
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling GET_PREFERENCES:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true

    default:
      logger.warn('Unknown message type:', message.type)
      sendResponse({ error: 'Unknown message type' })
      return false
  }
}
