import type { MessageRole } from '@/types'
import type { PlatformDetector } from './types'

/**
 * Helper function to check if element is visible
 */
function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  )
}

/**
 * Generic Platform Detector
 * Fallback detector for unknown chat platforms
 * Uses common ARIA roles and semantic HTML patterns
 */
export const genericDetector: PlatformDetector = {
  detect(): boolean {
    // Always returns true as fallback
    // This detector is used when no specific platform is detected
    return true
  },

  getChatContainer(): HTMLElement | null {
    // Try common ARIA roles and patterns
    const selectors = [
      '[role="log"]',
      '[role="region"][aria-label*="chat"]',
      '[role="region"][aria-label*="conversation"]',
      '[role="region"][aria-label*="messages"]',
      '[aria-label*="Chat"]',
      '[aria-label*="Messages"]',
      '.chat-container',
      '.messages-container',
      '.conversation-container',
      '#chat',
      '#messages'
    ]

    for (const selector of selectors) {
      const container = document.querySelector(selector) as HTMLElement
      if (container) return container
    }

    return null
  },

  getMessageElements(): HTMLElement[] {
    const container = this.getChatContainer()
    if (!container) return []

    // Try common message selectors
    const selectors = [
      '[role="article"]',
      '[role="listitem"]',
      '.message',
      '.chat-message',
      '.msg',
      '[data-message]',
      '[class*="message"]',
      '[class*="msg"]'
    ]

    for (const selector of selectors) {
      const messages = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
      if (messages.length > 0) return messages
    }

    // Fallback: get all direct children of container
    return Array.from(container.children) as HTMLElement[]
  },

  getMessageText(element: HTMLElement): string {
    // Try to find text content, excluding metadata
    const contentSelectors = [
      '[role="paragraph"]',
      '.message-text',
      '.message-content',
      '.msg-text',
      'p',
      'span'
    ]

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector)
      if (contentElement && contentElement.textContent) {
        return contentElement.textContent.trim()
      }
    }

    // Fallback: get all text content
    return element.textContent?.trim() || ''
  },

  getMessageRole(element: HTMLElement): MessageRole {
    // Check for role indicators
    const className = element.className?.toLowerCase() || ''
    const dataRole = element.getAttribute('data-role')?.toLowerCase() || ''
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || ''

    // Check for agent/support indicators
    const agentKeywords = ['agent', 'support', 'admin', 'staff', 'bot', 'assistant']
    const isAgent = agentKeywords.some(keyword =>
      className.includes(keyword) ||
      dataRole.includes(keyword) ||
      ariaLabel.includes(keyword)
    )

    if (isAgent) return 'agent'

    // Check for customer/user indicators
    const customerKeywords = ['customer', 'user', 'visitor', 'client']
    const isCustomer = customerKeywords.some(keyword =>
      className.includes(keyword) ||
      dataRole.includes(keyword) ||
      ariaLabel.includes(keyword)
    )

    if (isCustomer) return 'customer'

    // Fallback heuristic: check alignment
    // Messages aligned right are often from agents
    const style = window.getComputedStyle(element)
    const textAlign = style.textAlign
    const justifyContent = style.justifyContent
    const alignSelf = style.alignSelf

    if (
      textAlign === 'right' ||
      justifyContent === 'flex-end' ||
      alignSelf === 'flex-end'
    ) {
      return 'agent'
    }

    // Default to customer (safer assumption)
    return 'customer'
  },

  getInputBox(): HTMLElement | null {
    // Try common input selectors
    const selectors = [
      '[role="textbox"]',
      '[aria-label*="message"]',
      '[aria-label*="chat"]',
      '[placeholder*="Type"]',
      '[placeholder*="Message"]',
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      '.chat-input',
      '.message-input',
      '#message-input'
    ]

    for (const selector of selectors) {
      const input = document.querySelector(selector) as HTMLElement
      if (input && isVisible(input)) {
        return input
      }
    }

    return null
  },

  getSendButton(): HTMLElement | null {
    // Try common button selectors
    const selectors = [
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      '[aria-label*="Send message"]',
      '.send-button',
      '.submit-button',
      'button[class*="send"]',
      'button[class*="submit"]',
      '#send-button'
    ]

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLElement
      if (button && isVisible(button)) {
        return button
      }
    }

    // Fallback: look for button near input box
    const inputBox = this.getInputBox()
    if (inputBox) {
      const parent = inputBox.parentElement
      if (parent) {
        const button = parent.querySelector('button[type="submit"]') as HTMLElement
        if (button) return button
      }
    }

    return null
  },

  getPlatformName(): string {
    return 'generic'
  }
}
