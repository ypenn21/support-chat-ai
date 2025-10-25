import type { MessageRole } from '@/types'
import type { PlatformDetector } from './types'

/**
 * Intercom Platform Detector
 * Detects and interacts with Intercom Chat interfaces
 * Note: Intercom uses Shadow DOM which makes access more complex
 */
export const intercomDetector: PlatformDetector = {
  detect(): boolean {
    // Check if URL contains intercom.io
    if (window.location.hostname.includes('intercom.io') || window.location.hostname.includes('intercom.com')) {
      return true
    }

    // Check for Intercom-specific elements
    const hasIntercomWidget = document.querySelector('#intercom-container') !== null
    const hasIntercomFrame = document.querySelector('iframe[name*="intercom"]') !== null

    return hasIntercomWidget || hasIntercomFrame
  },

  getChatContainer(): HTMLElement | null {
    // Intercom uses iframes and shadow DOM
    // Try to access the main container
    const selectors = [
      '.intercom-conversation',
      '.intercom-messenger-conversation',
      '[data-testid="conversation"]',
      '#intercom-container'
    ]

    for (const selector of selectors) {
      const container = document.querySelector(selector) as HTMLElement
      if (container) return container
    }

    // Try to access iframe content
    const iframe = document.querySelector('iframe[name*="intercom"]') as HTMLIFrameElement
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          const container = iframeDoc.querySelector('.intercom-conversation') as HTMLElement
          if (container) return container
        }
      } catch (error) {
        // CORS restriction - cannot access iframe content
        console.warn('Cannot access Intercom iframe content due to CORS')
      }
    }

    return null
  },

  getMessageElements(): HTMLElement[] {
    const container = this.getChatContainer()
    if (!container) return []

    const selectors = [
      '.intercom-message',
      '[data-testid="message"]',
      '.message-item',
      '.conversation-part'
    ]

    for (const selector of selectors) {
      const messages = Array.from(container.querySelectorAll(selector)) as HTMLElement[]
      if (messages.length > 0) return messages
    }

    return []
  },

  getMessageText(element: HTMLElement): string {
    // Try to find message content
    const contentSelectors = [
      '.intercom-message-body',
      '[data-testid="message-body"]',
      '.message-content',
      '.intercom-comment-body'
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
    // Check for role indicators
    const className = element.className || ''
    const dataAuthor = element.getAttribute('data-author') || ''

    // Check for admin/agent indicators
    if (
      className.includes('admin') ||
      className.includes('operator') ||
      className.includes('agent') ||
      dataAuthor === 'admin'
    ) {
      return 'agent'
    }

    // Check for user/customer indicators
    if (
      className.includes('user') ||
      className.includes('visitor') ||
      dataAuthor === 'user'
    ) {
      return 'customer'
    }

    // Fallback: check for specific Intercom classes
    if (className.includes('intercom-comment-by-admin')) {
      return 'agent'
    }
    if (className.includes('intercom-comment-by-user')) {
      return 'customer'
    }

    // Default to customer
    return 'customer'
  },

  getInputBox(): HTMLElement | null {
    const selectors = [
      '.intercom-composer-input',
      '[data-testid="composer-input"]',
      'textarea[placeholder*="Type"]',
      '.intercom-composer-textarea',
      '[contenteditable="true"]'
    ]

    for (const selector of selectors) {
      const input = document.querySelector(selector) as HTMLElement
      if (input) return input
    }

    // Try iframe
    const iframe = document.querySelector('iframe[name*="intercom"]') as HTMLIFrameElement
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          for (const selector of selectors) {
            const input = iframeDoc.querySelector(selector) as HTMLElement
            if (input) return input
          }
        }
      } catch (error) {
        // CORS restriction
      }
    }

    return null
  },

  getSendButton(): HTMLElement | null {
    const selectors = [
      '.intercom-composer-send-button',
      '[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      '.intercom-send-button'
    ]

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLElement
      if (button) return button
    }

    // Try iframe
    const iframe = document.querySelector('iframe[name*="intercom"]') as HTMLIFrameElement
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          for (const selector of selectors) {
            const button = iframeDoc.querySelector(selector) as HTMLElement
            if (button) return button
          }
        }
      } catch (error) {
        // CORS restriction
      }
    }

    return null
  },

  getPlatformName(): string {
    return 'intercom'
  }
}
