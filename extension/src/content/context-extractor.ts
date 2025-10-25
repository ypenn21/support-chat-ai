import type { Message } from '@/types'
import type { PlatformDetector } from './platforms/types'

/**
 * Extract conversation context from DOM
 * Converts DOM message elements into structured Message objects
 */
export function extractConversationContext(
  platform: PlatformDetector,
  maxMessages: number = 10
): Message[] {
  try {
    const messageElements = platform.getMessageElements()

    if (messageElements.length === 0) {
      console.warn('[Context Extractor] No messages found')
      return []
    }

    // Take only the most recent messages (default: last 10)
    const recentMessageElements = messageElements.slice(-maxMessages)

    const messages: Message[] = []

    for (const element of recentMessageElements) {
      const content = platform.getMessageText(element)
      const role = platform.getMessageRole(element)

      // Skip empty messages
      if (!content || content.trim() === '') {
        continue
      }

      // Try to extract timestamp from element
      const timestamp = extractTimestamp(element)

      messages.push({
        role,
        content: content.trim(),
        timestamp
      })
    }

    console.log(`[Context Extractor] Extracted ${messages.length} messages`)
    return messages
  } catch (error) {
    console.error('[Context Extractor] Failed to extract context:', error)
    return []
  }
}

/**
 * Extract timestamp from message element
 * Falls back to current time if not found
 */
function extractTimestamp(element: HTMLElement): number {
  // Try to find timestamp element
  const timestampSelectors = [
    '[data-timestamp]',
    '.timestamp',
    '.message-time',
    'time',
    '[datetime]'
  ]

  for (const selector of timestampSelectors) {
    const timestampElement = element.querySelector(selector)
    if (timestampElement) {
      // Try data-timestamp attribute
      const dataTimestamp = timestampElement.getAttribute('data-timestamp')
      if (dataTimestamp) {
        const parsed = parseInt(dataTimestamp)
        if (!isNaN(parsed)) return parsed
      }

      // Try datetime attribute
      const datetime = timestampElement.getAttribute('datetime')
      if (datetime) {
        const parsed = Date.parse(datetime)
        if (!isNaN(parsed)) return parsed
      }

      // Try parsing text content
      const text = timestampElement.textContent
      if (text) {
        const parsed = Date.parse(text)
        if (!isNaN(parsed)) return parsed
      }
    }
  }

  // Fallback to current time
  return Date.now()
}

/**
 * Get the last customer message from conversation context
 */
export function getLastCustomerMessage(messages: Message[]): Message | null {
  // Iterate backwards to find the most recent customer message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'customer') {
      return messages[i]
    }
  }
  return null
}

/**
 * Get the last agent message from conversation context
 */
export function getLastAgentMessage(messages: Message[]): Message | null {
  // Iterate backwards to find the most recent agent message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'agent') {
      return messages[i]
    }
  }
  return null
}

/**
 * Check if the last message is from a customer
 * Used to determine if we should trigger a suggestion
 */
export function isLastMessageFromCustomer(messages: Message[]): boolean {
  if (messages.length === 0) return false
  return messages[messages.length - 1].role === 'customer'
}

/**
 * Count messages by role
 */
export function countMessagesByRole(messages: Message[]): { agent: number; customer: number } {
  return messages.reduce(
    (acc, msg) => {
      if (msg.role === 'agent') {
        acc.agent++
      } else {
        acc.customer++
      }
      return acc
    },
    { agent: 0, customer: 0 }
  )
}
