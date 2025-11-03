import type { Message } from '@/types'
import type { PlatformDetector } from './platforms/types'
import { debounce } from '@/lib/debounce'
import { extractConversationContext, isLastMessageFromCustomer } from './context-extractor'

/**
 * Callback function type for new messages
 */
export type NewMessageCallback = (messages: Message[]) => void

/**
 * Create a MutationObserver to watch for new messages in the chat
 *
 * @param platform - Platform detector for accessing DOM elements
 * @param onNewMessage - Callback function to invoke when new messages are detected
 * @param options - Configuration options
 * @returns Cleanup function to disconnect the observer
 */
export function createChatObserver(
  platform: PlatformDetector,
  onNewMessage: NewMessageCallback,
  options: {
    debounceDelay?: number
    onlyCustomerMessages?: boolean
    mode?: 'suggestion' | 'yolo'
  } = {}
): () => void {
  const {
    debounceDelay = 500,
    onlyCustomerMessages = false,
    mode = 'suggestion'
  } = options

  // Get the chat container
  const container = platform.getChatContainer()
  if (!container) {
    console.error('[DOM Observer] No chat container found')
    return () => {} // Return no-op cleanup function
  }

  // Track the last message count to detect new messages
  let previousMessageCount = platform.getMessageElements().length

  // Track last agent name for transition detection (chatbot -> human agent)
  let lastAgentName: string | null = null

  // Debounced mutation handler to prevent excessive calls
  const handleMutation = debounce(() => {
    try {
      const currentMessages = platform.getMessageElements()
      const currentMessageCount = currentMessages.length

      // Check if new messages were added
      if (currentMessageCount > previousMessageCount) {
        console.log(`[DOM Observer] Detected ${currentMessageCount - previousMessageCount} new message(s)`)

        // Extract full conversation context
        const context = extractConversationContext(platform)

        if (context.length === 0) {
          console.warn('[DOM Observer] No valid messages in context')
          previousMessageCount = currentMessageCount
          return
        }

        // Log last message info
        const lastMsg = context[context.length - 1]
        console.log(`[DOM Observer] Last message role: ${lastMsg.role}, content: "${lastMsg.content.substring(0, 50)}..."`)

        // Detect agent transitions (chatbot -> human agent)
        // This is important for YOLO mode on platforms like Coinbase
        if (lastMsg.role === 'agent') {
          // Try to extract agent name from the last message element
          const messageElements = platform.getMessageElements()
          if (messageElements.length > 0) {
            const lastMessageElement = messageElements[messageElements.length - 1]
            const participantNameElement = lastMessageElement.querySelector('[data-testid="participant-name"]')

            if (participantNameElement) {
              const currentAgentName = participantNameElement.textContent?.trim() || 'Unknown Agent'

              if (lastAgentName && lastAgentName !== currentAgentName) {
                console.log(`[DOM Observer] Agent transition detected: "${lastAgentName}" -> "${currentAgentName}"`)
                // Could broadcast this event if needed for UI updates
              }

              lastAgentName = currentAgentName
              console.log(`[DOM Observer] Current agent: ${currentAgentName}`)
            }
          }
        }

        // In Suggestion Mode: only trigger on customer messages (agent needs suggestions)
        // In YOLO Mode: trigger on ALL messages (AI responds to chatbot, customer, and agent transitions)
        const shouldTrigger =
          (mode === 'suggestion' && isLastMessageFromCustomer(context)) ||
          (mode === 'yolo')  // Always trigger in YOLO mode for any new message

        console.log(`[DOM Observer] Mode: ${mode}, shouldTrigger: ${shouldTrigger}`)

        // Optional: filter to only customer messages
        if (onlyCustomerMessages && !isLastMessageFromCustomer(context)) {
          console.log('[DOM Observer] Skipping: last message is not from customer')
          previousMessageCount = currentMessageCount
          return
        }

        if (shouldTrigger) {
          // Trigger callback with conversation context
          console.log(`[DOM Observer] Triggering callback with ${context.length} messages in context`)
          onNewMessage(context)
        } else {
          console.log('[DOM Observer] Not triggering - conditions not met')
        }

        // Update message count
        previousMessageCount = currentMessageCount
      } else if (currentMessageCount < previousMessageCount) {
        // Messages were removed (rare, but possible if chat is cleared)
        console.log('[DOM Observer] Messages were removed from chat')
        previousMessageCount = currentMessageCount
      }
    } catch (error) {
      console.error('[DOM Observer] Error in mutation handler:', error)
    }
  }, debounceDelay)

  // Create MutationObserver
  const observer = new MutationObserver((mutations) => {
    // Check if mutations are relevant (childList changes)
    const hasRelevantMutations = mutations.some(
      (mutation) => mutation.type === 'childList' && mutation.addedNodes.length > 0
    )

    if (hasRelevantMutations) {
      handleMutation()
    }
  })

  // Start observing the chat container
  observer.observe(container, {
    childList: true, // Watch for added/removed child nodes
    subtree: true // Watch all descendants
  })

  console.log(`[DOM Observer] Started observing ${platform.getPlatformName()} chat (mode: ${mode})`)

  // Return cleanup function
  return () => {
    observer.disconnect()
    console.log('[DOM Observer] Disconnected observer')
  }
}

/**
 * Wait for the chat container to appear in the DOM
 * Some platforms load chat asynchronously
 */
export async function waitForChatContainer(
  platform: PlatformDetector,
  maxWaitMs: number = 10000,
  checkIntervalMs: number = 500
): Promise<HTMLElement | null> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const checkContainer = () => {
      const container = platform.getChatContainer()

      if (container) {
        console.log('[DOM Observer] Chat container found')
        resolve(container)
        return
      }

      // Check if timeout exceeded
      if (Date.now() - startTime >= maxWaitMs) {
        console.warn('[DOM Observer] Timeout waiting for chat container')
        resolve(null)
        return
      }

      // Check again after interval
      setTimeout(checkContainer, checkIntervalMs)
    }

    checkContainer()
  })
}
