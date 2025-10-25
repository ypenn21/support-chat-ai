import type { MessageRole } from '@/types'
import type { PlatformDetector } from './types'

/**
 * Zendesk Platform Detector
 * Detects and interacts with Zendesk Chat interfaces
 */
export const zendeskDetector: PlatformDetector = {
  detect(): boolean {
    // Check if URL contains zendesk.com
    if (window.location.hostname.includes('zendesk.com')) {
      return true
    }

    // Check for Zendesk-specific elements
    const hasZendeskWidget = document.querySelector('[data-test-id="chat-widget"]') !== null
    const hasZendeskChat = document.querySelector('.zendesk-chat') !== null

    return hasZendeskWidget || hasZendeskChat
  },

  getChatContainer(): HTMLElement | null {
    // Try multiple selectors with fallbacks
    const selectors = [
      '[data-test-id="chat-log"]',
      '.chat-wrapper',
      '.chat-messages',
      '[role="log"]',
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
      '[data-test-id="chat-message"]',
      '.chat-msg',
      '.message',
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
      '[data-test-id="message-content"]',
      '.chat-msg-text',
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

    // Check for agent indicators
    if (
      className.includes('agent') ||
      className.includes('staff') ||
      dataRole === 'agent'
    ) {
      return 'agent'
    }

    // Check for customer indicators
    if (
      className.includes('customer') ||
      className.includes('visitor') ||
      className.includes('user') ||
      dataRole === 'customer'
    ) {
      return 'customer'
    }

    // Fallback: check if message is on right side (usually agent) or left (customer)
    const style = window.getComputedStyle(element)
    const textAlign = style.textAlign
    const marginLeft = parseInt(style.marginLeft)
    const marginRight = parseInt(style.marginRight)

    if (textAlign === 'right' || marginLeft > marginRight) {
      return 'agent'
    }

    // Default to customer
    return 'customer'
  },

  getInputBox(): HTMLElement | null {
    const selectors = [
      '[data-test-id="chat-input"]',
      '.chat-input',
      'textarea[placeholder*="Type"]',
      '[contenteditable="true"]',
      'input[type="text"]'
    ]

    for (const selector of selectors) {
      const input = document.querySelector(selector) as HTMLElement
      if (input) return input
    }

    return null
  },

  getSendButton(): HTMLElement | null {
    const selectors = [
      '[data-test-id="send-button"]',
      '.chat-send-button',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      '.send-btn'
    ]

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLElement
      if (button) return button
    }

    return null
  },

  getPlatformName(): string {
    return 'zendesk'
  }
}
