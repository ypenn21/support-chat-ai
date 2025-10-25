import type { MessageRole } from '@/types'

/**
 * Platform Detector Interface
 * Each platform (Zendesk, Intercom, etc.) implements this interface
 * to provide platform-specific DOM access patterns
 */
export interface PlatformDetector {
  /**
   * Detect if this platform is active on the current page
   */
  detect(): boolean

  /**
   * Get the main chat container element
   */
  getChatContainer(): HTMLElement | null

  /**
   * Get all message elements in the chat
   */
  getMessageElements(): HTMLElement[]

  /**
   * Extract text content from a message element
   */
  getMessageText(element: HTMLElement): string

  /**
   * Determine the role (agent or customer) of a message
   */
  getMessageRole(element: HTMLElement): MessageRole

  /**
   * Get the chat input box element
   */
  getInputBox(): HTMLElement | null

  /**
   * Get the send button element (for YOLO mode auto-send)
   */
  getSendButton(): HTMLElement | null

  /**
   * Get the platform name
   */
  getPlatformName(): string
}
