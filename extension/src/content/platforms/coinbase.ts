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
    const selectors = [
      '[data-testid="chat-log"]',
      '.chat-container',
      '.conversation-panel'
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
    const selectors = [
      '[data-testid="chat-message"]',
      '.chat-message',
      '[role="article"]'
    ]

    for (const selector of selectors) {
      const messages = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
      if (messages.length > 0) return messages
    }

    return []
  },

  getMessageText(element: HTMLElement): string {
    // Try to find message content with multiple selectors
    const contentSelectors = [
      '[data-testid="message-content"]',
      '.message-text',
      '.message-content'
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
    // Check for agent/customer indicators
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

    return 'customer'
  },

  getInputBox(): HTMLElement | null {
    const selectors = [
      '[data-testid="chat-input"]',
      'textarea[placeholder*="Type"]',
      '[contenteditable="true"]'
    ]

    for (const selector of selectors) {
      const input = document.querySelector(selector) as HTMLElement
      if (input) return input
    }

    return null
  },

  getSendButton(): HTMLElement | null {
    const selectors = [
      '[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLElement
      if (button) return button
    }

    return null
  },

  getPlatformName(): string {
    return 'coinbase'
  }
}

