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
import type { Message, SuggestResponse, AutonomousResponse, YoloState } from '@/types'
import {
  mountSuggestionPanel,
  showLoadingPanel,
  showErrorPanel,
  unmountSuggestionPanel
} from './ui-injector'
import { createLogger } from '@/lib/logger'
import { setupGlobalErrorHandler } from '@/lib/error-handler'
import { getMode, getYoloState } from '@/lib/storage'
import { AutoResponder } from './auto-responder'
import { SafetyMonitor } from './safety-monitor'

const logger = createLogger('Content Script')

// Global state
let cleanupObserver: (() => void) | null = null
let currentMode: 'suggestion' | 'yolo' = 'suggestion'
let autoResponder: AutoResponder | null = null
let safetyMonitor: SafetyMonitor | null = null
let yoloState: YoloState | null = null

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

  // Get YOLO state if in YOLO mode
  if (currentMode === 'yolo') {
    yoloState = await getYoloState()
    if (!yoloState) {
      logger.error('YOLO mode enabled but no goal configured. Switching to suggestion mode.')
      currentMode = 'suggestion'
    } else {
      logger.info(`YOLO goal: ${yoloState.goal.description}`)
    }
  }

  // Wait for platform to load (with 10 second timeout)
  logger.info('Waiting for chat platform to load...')
  const platform = await waitForPlatform(10000)

  if (!platform) {
    logger.warn('No supported chat platform detected. Extension will not activate.')
    return
  }

  const platformType = platform.getPlatformName()
  logger.info(`Platform detected: ${platformType}`)

  // Initialize YOLO mode components if needed
  if (currentMode === 'yolo' && yoloState) {
    autoResponder = new AutoResponder(platform, 2000) // 2 second preview delay (+ 2-3s thinking = 4-5s total)
    safetyMonitor = new SafetyMonitor(yoloState.safetyConstraints)
    logger.info('Auto Responder initialized with 2000ms preview delay')
    logger.info('Safety monitor initialized', yoloState.safetyConstraints)
    logger.info('YOLO mode components initialized')
  }

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
    await handleYoloMode(messages)
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
 * Handle YOLO Mode (Autonomous Response)
 * Request autonomous response and auto-send
 */
async function handleYoloMode(messages: Message[]): Promise<void> {
  logger.info('Handling YOLO Mode')

  if (!yoloState || !autoResponder || !safetyMonitor) {
    logger.error('YOLO mode not properly initialized')
    return
  }

  // Check safety before proceeding
  const lastMessage = messages[messages.length - 1]
  const safetyCheck = safetyMonitor.checkMessage(lastMessage, yoloState.goalState)

  if (safetyCheck.shouldEscalate) {
    logger.warn('Safety escalation triggered:', safetyCheck.reason)
    await handleEscalation(safetyCheck.reason || 'Safety check failed')
    return
  }

  // Simulate "thinking" delay before generating response (2-3 seconds)
  // This makes the AI responses feel more natural and less robotic
  const thinkingDelay = 2000 + Math.random() * 1000 // 2-3 seconds
  logger.info(`[YOLO] Simulating thinking delay: ${Math.floor(thinkingDelay)}ms`)
  await new Promise(resolve => setTimeout(resolve, thinkingDelay))
  logger.info('[YOLO] Thinking delay complete, generating response...')

  try {
    // Get the platform type for the request
    const platformType = detectPlatformType()

    // Request autonomous response from background worker
    logger.info('[YOLO] Requesting autonomous response from background worker...')

    const response: AutonomousResponse = await chrome.runtime.sendMessage({
      type: 'GET_AUTONOMOUS_RESPONSE',
      payload: {
        platform: platformType,
        conversation_context: messages.slice(-10),
        goal: yoloState.goal,
        goal_state: yoloState.goalState,
        safety_constraints: yoloState.safetyConstraints
      }
    })

    logger.info('[YOLO] Received autonomous response, action:', response.action)

    // Handle different actions
    switch (response.action) {
      case 'respond':
        if (response.response) {
          logger.info('[YOLO] AI decided to respond with confidence:', response.response.confidence)

          // Check confidence
          if (!safetyMonitor.checkConfidence(response.response.confidence)) {
            logger.warn('[YOLO] Low confidence response, escalating. Confidence:', response.response.confidence)
            await handleEscalation('AI confidence too low')
            return
          }

          // Auto-send response
          logger.info('[YOLO] Auto-sending response (preview enabled):', response.response.content.substring(0, 100) + '...')
          await autoResponder.sendResponse(response.response.content, true) // With preview

          // Update goal state
          logger.info('[YOLO] Updating goal state...')
          await chrome.runtime.sendMessage({
            type: 'UPDATE_GOAL_STATE',
            payload: { goalState: response.goal_state }
          })

          // Broadcast conversation update
          logger.info('[YOLO] Broadcasting conversation update...')
          await chrome.runtime.sendMessage({
            type: 'CONVERSATION_UPDATE',
            payload: { messages: [...messages, {
              role: 'agent',
              content: response.response.content,
              timestamp: Date.now()
            }]}
          })

          logger.info('[YOLO] Response sent successfully!')
        } else {
          logger.warn('[YOLO] Action is "respond" but no response content provided')
        }
        break

      case 'escalate':
        logger.warn('[YOLO] AI decided to escalate:', response.reason)
        await handleEscalation(response.reason || 'AI escalation')
        break

      case 'goal_complete':
        logger.info('[YOLO] Goal completed!', response.reason)
        await handleGoalCompletion(response.reason || 'Goal achieved')
        break

      case 'need_info':
        logger.info('[YOLO] AI waiting for more information:', response.reason)
        // Do nothing, wait for next message
        break

      default:
        logger.warn('[YOLO] Unknown action from AI:', response.action)
    }
  } catch (error) {
    logger.error('[YOLO] Failed to handle YOLO mode:', error)
    await handleEscalation(`Error: ${error}`)
  }
}

/**
 * Handle escalation - switch back to suggestion mode
 */
async function handleEscalation(reason: string): Promise<void> {
  logger.warn('Escalating to human:', reason)

  // Switch to suggestion mode
  await chrome.runtime.sendMessage({
    type: 'SET_MODE',
    payload: { mode: 'suggestion' }
  })

  currentMode = 'suggestion'

  // Show notification
  showErrorPanel(`Escalated: ${reason}. Switching to manual mode.`)
}

/**
 * Handle goal completion
 */
async function handleGoalCompletion(reason: string): Promise<void> {
  logger.info('Goal completed:', reason)

  // Switch to suggestion mode
  await chrome.runtime.sendMessage({
    type: 'SET_MODE',
    payload: { mode: 'suggestion' }
  })

  currentMode = 'suggestion'

  // Show success notification (could create a success panel)
  logger.info(`✅ Goal completed: ${reason}`)
}

/**
 * Handle mode changes and other runtime messages
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
  } else if (message.type === 'EMERGENCY_STOP') {
    logger.warn('Emergency stop received!')
    handleEscalation('Emergency stop activated by user')
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
