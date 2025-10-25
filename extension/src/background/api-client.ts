import type { SuggestRequest, SuggestResponse } from '@/types'
import { getSuggestion } from '@/lib/mock-api'
import { createLogger } from '@/lib/logger'
import { APIError } from '@/lib/error-handler'

const logger = createLogger('API Client')

/**
 * API Client for Background Service Worker
 * Handles all API communication with the backend
 *
 * Currently uses mock API, but will be replaced with real API calls
 * when backend is deployed
 */

/**
 * Get suggestion from backend (or mock API)
 */
export async function fetchSuggestion(request: SuggestRequest): Promise<SuggestResponse> {
  try {
    logger.info('Fetching suggestion from API')
    logger.debug('Request payload:', request)

    const response = await getSuggestion(request)

    logger.info('Suggestion received successfully')
    logger.debug('Response:', response)

    return response
  } catch (error) {
    logger.error('Failed to fetch suggestion:', error)
    throw new APIError('Failed to fetch suggestion from backend', {
      request,
      error
    })
  }
}

/**
 * Validate suggestion request before sending
 */
export function validateSuggestionRequest(request: any): request is SuggestRequest {
  if (!request) {
    logger.error('Request is null or undefined')
    return false
  }

  if (!request.platform) {
    logger.error('Missing platform in request')
    return false
  }

  if (!Array.isArray(request.conversation_context)) {
    logger.error('conversation_context is not an array')
    return false
  }

  if (request.conversation_context.length === 0) {
    logger.warn('conversation_context is empty')
    // This is allowed, but warn about it
  }

  return true
}
