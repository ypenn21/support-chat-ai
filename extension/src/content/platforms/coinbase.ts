import type { MessageRole } from '@/types'
import type { PlatformDetector } from './types'

/**
 * Coinbase Platform Detector
 * Detects and interacts with Coinbase Chat interfaces
 */
export const coinbaseDetector: PlatformDetector = {
  detect(): boolean {
    // Check if URL contains coinbase.com
    if (window.location.hostname.includes('coinbase.com')) {
      return true
    }

    // Check for Coinbase-specific elements
    const hasCoinbaseWidget = document.querySelector('[data-coinbase-widget]') !== null
    const hasCoinbaseChat = document.querySelector('.coinbase-chat') !== null

    return hasCoinbaseWidget || hasCoinbaseChat
  },

  getChatContainer(): HTMLElement | null {
    // Try multiple selectors with fallbacks
    // Coinbase uses a chat wrapper that persists through chatbot -> agent transition
    const selectors = [
      '#cb-chat-wrapper',                      // Main chat wrapper
      '[data-testid="widget-layout"]',         // Widget container
      '.chat-body-scroller',                   // Message scroller
      '[data-testid="chat-log"]',             // Fallback (might exist in other views)
      '.chat-container',                       // Generic fallback
      '.conversation-panel'                    // Generic fallback
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

    // Try multiple message selectors
    // Coinbase uses message-bubble elements that work for both chatbot and human agents
    const selectors = [
      '[data-testid="message-bubble"]',        // Primary: Coinbase message bubbles
      '[id^="event-"]',                        // Event containers (wrapper divs)
      '[data-testid^="message-container-"]',   // Message containers
      '[data-testid="chat-message"]',         // Fallback
      '.chat-message',                         // Fallback
      '[role="article"]'                       // Fallback
    ]

    for (const selector of selectors) {
      const messages = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
      if (messages.length > 0) return messages
    }

    return []
  },

  getMessageText(element: HTMLElement): string {
    // For message-bubble elements, look inside for the actual content
    if (element.hasAttribute('data-testid') && element.getAttribute('data-testid') === 'message-bubble') {
      const messageContainer = element.querySelector('[data-testid^="message-container-"]')
      if (messageContainer) {
        element = messageContainer as HTMLElement
      }
    }

    // Try to find message content with multiple selectors
    const contentSelectors = [
      'p.cds-body-bwup3gq',                    // Coinbase body text
      'p.cds-typographyResets-t6muwls',       // Coinbase typography resets
      '[data-testid="message-content"]',       // Generic
      '.message-text',                         // Fallback
      '.message-content',                      // Fallback
      'p'                                      // Last resort - any paragraph
    ]

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector)
      if (contentElement) {
        return contentElement.textContent?.trim() || ''
      }
    }

    // Fallback to element's text content
    return element.textContent?.trim() || ''
  },

  getMessageRole(element: HTMLElement): MessageRole {
    // Look for participant name - works for both chatbot and human agents
    let roleElement = element.querySelector('[data-testid="participant-name"]')
    if (roleElement) {
      const text = roleElement.textContent?.toLowerCase() || ''
      // Virtual Assistant, support agents, or any other agent name
      if (text.includes('virtual assistant') || text.includes('assistant') ||
          text.includes('bot') || text.includes('agent') || text.includes('support')) {
        return 'agent'
      }
      // If it has a participant name that's not an agent identifier, it's likely the user
      return 'customer'
    }

    // Check message container styling - Coinbase uses different background colors
    const messageContainer = element.querySelector('[data-testid^="message-container-"]') as HTMLElement
    if (messageContainer) {
      const className = messageContainer.className || ''

      // Agent messages: backgroundAlternate (gray background)
      if (className.includes('backgroundAlternate') || className.includes('cds-backgroundAlternate')) {
        return 'agent'
      }

      // Customer messages: primary background (blue background)
      if (className.includes('primary-pf3x0oa') || className.includes('cds-primary')) {
        return 'customer'
      }
    }

    // Check alignment - customer messages are typically right-aligned
    const parentDiv = element.closest('.cds-flex-f1tjavv3.cds-center-c14yogr6')
    if (parentDiv) {
      const className = parentDiv.className || ''
      if (className.includes('flex-end-fh3d6bv') || className.includes('cds-flex-end')) {
        return 'customer'
      }
      if (className.includes('flex-start-f1bkgt2u') || className.includes('cds-flex-start')) {
        return 'agent'
      }
    }

    // Fallback: check for legacy indicators
    const className = element.className || ''
    const dataRole = element.getAttribute('data-role') || ''

    if (
      className.includes('agent') ||
      className.includes('staff') ||
      dataRole === 'agent'
    ) {
      return 'agent'
    }

    if (
      className.includes('customer') ||
      className.includes('user') ||
      dataRole === 'customer'
    ) {
      return 'customer'
    }

    // Default to customer if unclear
    return 'customer'
  },

  getInputBox(): HTMLElement | null {
    const selectors = [
      'textarea[placeholder*="help"]',         // Coinbase uses placeholders like "How can I help"
      'textarea[placeholder*="type"]',         // Common placeholder
      'input[role="searchbox"]',               // Might be input element
      '[data-testid="chat-input"]',           // Generic
      'textarea[placeholder*="Type"]',         // Fallback
      '[contenteditable="true"]'               // Fallback
    ]

    for (const selector of selectors) {
      const input = document.querySelector(selector) as HTMLElement
      if (input && input.isConnected) {
        // Verify it's visible and in the chat context, not in header search
        const chatWrapper = document.querySelector('#cb-chat-wrapper')
        if (chatWrapper && chatWrapper.contains(input)) {
          return input
        }
        // If no chat wrapper found yet, but input looks like a chat input
        if (!chatWrapper && (selector.includes('chat') || selector.includes('help'))) {
          return input
        }
      }
    }

    return null
  },

  getSendButton(): HTMLElement | null {
    const selectors = [
      'button[aria-label*="Send"]',            // Coinbase likely uses aria-label
      'button[aria-label*="send"]',            // lowercase variant
      '[data-testid="send-button"]',          // Generic
      'button[type="submit"]',                 // In form context
      'button[aria-label*="submit"]'           // Alternative
    ]

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLElement
      if (button && button.isConnected) {
        // Verify it's in chat context, not a search submit button
        const chatWrapper = document.querySelector('#cb-chat-wrapper')
        if (chatWrapper && chatWrapper.contains(button)) {
          return button
        }
        // If no chat wrapper found yet, but button looks like a send button
        if (!chatWrapper && selector.includes('send')) {
          return button
        }
      }
    }

    return null
  },

  getPlatformName(): string {
    return 'coinbase'
  }
}

