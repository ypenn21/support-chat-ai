import type { MessageRole } from '@/types'
import type { PlatformDetector } from './types'

/**
 * Robinhood Platform Detector
 * Detects and interacts with Robinhood Chat interfaces
 */
export const robinhoodDetector: PlatformDetector = {
  detect(): boolean {
    // Check if URL contains robinhood.com
    if (window.location.hostname.includes('robinhood.com')) {
      return true
    }

    // Check for Robinhood-specific elements
    const hasRobinhoodWidget = document.querySelector('[data-robinhood-widget]') !== null
    const hasRobinhoodChat = document.querySelector('.robinhood-chat') !== null

    return hasRobinhoodWidget || hasRobinhoodChat
  },

  getChatContainer(): HTMLElement | null {
    const selectors = [
      '.chat-container',
      '[data-testid="conversation"]'
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

    const selectors = [
      '.message-item',
      '[data-testid="message"]'
    ]

    for (const selector of selectors) {
      const messages = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
      if (messages.length > 0) return messages
    }

    return []
  },

  getMessageText(element: HTMLElement): string {
    const contentSelectors = [
      '.message-content',
      '[data-testid="message-body"]'
    ]

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector)
      if (contentElement) {
        return contentElement.textContent?.trim() || ''
      }
    }

    return element.textContent?.trim() || ''
  },

  getMessageRole(element: HTMLElement): MessageRole {
    const className = element.className || ''
    const dataAuthor = element.getAttribute('data-author') || ''

    if (
      className.includes('agent') ||
      className.includes('operator') ||
      dataAuthor === 'agent'
    ) {
      return 'agent'
    }

    if (
      className.includes('user') ||
      dataAuthor === 'user'
    ) {
      return 'customer'
    }

    return 'customer'
  },

  getInputBox(): HTMLElement | null {
    const selectors = [
      '[data-testid="composer-input"]',
      'textarea[placeholder*="Type"]'
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
      'button[aria-label*="Send"]'
    ]

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLElement
      if (button) return button
    }

    return null
  },

  getPlatformName(): string {
    return 'robinhood'
  }
}

