import type { RuntimeMessage, SuggestRequest, UserPreferences, AutonomousRequest, Goal, SafetyConstraints, GoalState } from '@/types'
import { fetchSuggestion, validateSuggestionRequest } from './api-client'
import { getPreferences, savePreferences, getMode, setMode, getYoloState, saveYoloState } from '@/lib/storage'
import { createLogger } from '@/lib/logger'
import { formatErrorForUser } from '@/lib/error-handler'
import { getAutonomousResponse } from '@/lib/mock-api'
import { ModeController } from './mode-controller'
import { GoalTracker } from './goal-tracker'

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
 * Handle GET_AUTONOMOUS_RESPONSE message (YOLO Mode)
 */
async function handleGetAutonomousResponse(payload: any): Promise<any> {
  logger.info('Handling GET_AUTONOMOUS_RESPONSE request')

  try {
    const request = payload as AutonomousRequest

    // Get autonomous response from mock API
    const response = await getAutonomousResponse(request)

    logger.info('Successfully fetched autonomous response, action:', response.action)
    return response
  } catch (error) {
    logger.error('Failed to get autonomous response:', error)
    return {
      error: formatErrorForUser(error)
    }
  }
}

/**
 * Handle SET_MODE message
 */
async function handleSetMode(payload: any): Promise<any> {
  logger.info('Handling SET_MODE request')

  try {
    const { mode } = payload

    // Update mode in storage
    await setMode(mode)

    // Broadcast mode change to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'MODE_CHANGED',
            payload: { mode }
          }).catch(() => {
            // Ignore errors from tabs that don't have content script
          })
        }
      })
    })

    logger.info('Successfully set mode to:', mode)
    return { success: true, mode }
  } catch (error) {
    logger.error('Failed to set mode:', error)
    return {
      error: formatErrorForUser(error)
    }
  }
}

/**
 * Handle GET_MODE message
 */
async function handleGetMode(): Promise<any> {
  logger.info('Handling GET_MODE request')

  try {
    const mode = await getMode()

    logger.info('Successfully retrieved mode:', mode)
    return { mode }
  } catch (error) {
    logger.error('Failed to get mode:', error)
    return {
      error: formatErrorForUser(error)
    }
  }
}

/**
 * Handle SET_GOAL message (YOLO Mode)
 */
async function handleSetGoal(payload: any): Promise<any> {
  logger.info('Handling SET_GOAL request')

  try {
    const { goal, constraints } = payload as { goal: Goal; constraints: SafetyConstraints }

    // Initialize goal tracker
    const goalTracker = new GoalTracker()
    await goalTracker.initialize()
    await goalTracker.setGoal(goal, constraints)

    logger.info('Successfully set goal:', goal.description)
    return { success: true }
  } catch (error) {
    logger.error('Failed to set goal:', error)
    return {
      error: formatErrorForUser(error)
    }
  }
}

/**
 * Handle UPDATE_GOAL_STATE message (YOLO Mode)
 */
async function handleUpdateGoalState(payload: any): Promise<any> {
  logger.info('Handling UPDATE_GOAL_STATE request')

  try {
    const { goalState } = payload as { goalState: GoalState }

    // Get current yolo state and update goal state
    const yoloState = await getYoloState()
    if (yoloState) {
      yoloState.goalState = goalState
      await saveYoloState(yoloState)
      logger.info('Successfully updated goal state')
      return { success: true }
    } else {
      logger.warn('No YOLO state found to update')
      return { error: 'No active YOLO state' }
    }
  } catch (error) {
    logger.error('Failed to update goal state:', error)
    return {
      error: formatErrorForUser(error)
    }
  }
}

/**
 * Handle EMERGENCY_STOP message (YOLO Mode)
 */
async function handleEmergencyStop(): Promise<any> {
  logger.warn('Handling EMERGENCY_STOP request')

  try {
    // Use mode controller to handle emergency stop
    const modeController = new ModeController()
    await modeController.initialize()
    await modeController.emergencyStop()

    logger.info('Emergency stop executed successfully')
    return { success: true }
  } catch (error) {
    logger.error('Failed to execute emergency stop:', error)
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

    case 'GET_AUTONOMOUS_RESPONSE':
      handleGetAutonomousResponse(message.payload)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling GET_AUTONOMOUS_RESPONSE:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true

    case 'SET_MODE':
      handleSetMode(message.payload)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling SET_MODE:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true

    case 'GET_MODE':
      handleGetMode()
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling GET_MODE:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true

    case 'SET_GOAL':
      handleSetGoal(message.payload)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling SET_GOAL:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true

    case 'UPDATE_GOAL_STATE':
      handleUpdateGoalState(message.payload)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling UPDATE_GOAL_STATE:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true

    case 'EMERGENCY_STOP':
      handleEmergencyStop()
        .then(sendResponse)
        .catch((error) => {
          logger.error('Error handling EMERGENCY_STOP:', error)
          sendResponse({ error: formatErrorForUser(error) })
        })
      return true

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
