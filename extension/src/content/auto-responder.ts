import type { PlatformDetector } from './platforms/types'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Auto Responder')

/**
 * Auto Responder
 * Handles automatic injection and sending of AI responses in YOLO mode
 * Includes preview delay and safety checks
 */
export class AutoResponder {
  private platform: PlatformDetector
  private previewDelay: number // milliseconds

  constructor(platform: PlatformDetector, previewDelay = 3000) {
    this.platform = platform
    this.previewDelay = previewDelay
    logger.info(`Auto responder initialized with ${previewDelay}ms preview delay`)
  }

  /**
   * Send response automatically
   * @param content - The response content to send
   * @param preview - Whether to show preview before sending
   */
  async sendResponse(content: string, preview = true): Promise<void> {
    logger.info('Preparing to send autonomous response')

    const inputBox = this.platform.getInputBox()
    const sendButton = this.platform.getSendButton()

    if (!inputBox) {
      throw new Error('Cannot find input box - unable to send response')
    }

    if (!sendButton) {
      throw new Error('Cannot find send button - unable to send response')
    }

    // Inject response into input
    this.setInputValue(inputBox, content)
    logger.debug('Response injected into input box')

    // Optional preview delay
    if (preview && this.previewDelay > 0) {
      logger.info(`Showing preview for ${this.previewDelay}ms`)
      this.showPreview(content)
      await this.delay(this.previewDelay)
      this.hidePreview()
    }

    // Click send button
    this.clickSend(sendButton)
    logger.info('Response sent successfully')
  }

  /**
   * Set input value with proper event triggering
   */
  private setInputValue(inputBox: HTMLElement, value: string): void {
    if (inputBox instanceof HTMLInputElement || inputBox instanceof HTMLTextAreaElement) {
      // Standard input/textarea
      inputBox.value = value
      inputBox.dispatchEvent(new Event('input', { bubbles: true }))
      inputBox.dispatchEvent(new Event('change', { bubbles: true }))
    } else {
      // ContentEditable div
      inputBox.textContent = value
      inputBox.dispatchEvent(new Event('input', { bubbles: true }))

      // Some platforms need additional events
      inputBox.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }))
      inputBox.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))
    }
  }

  /**
   * Click the send button
   */
  private clickSend(sendButton: HTMLElement): void {
    // Try multiple click methods to ensure compatibility
    sendButton.click()

    // Dispatch actual click event for platforms that listen to events
    sendButton.dispatchEvent(new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    }))
  }

  /**
   * Show preview notification
   */
  private showPreview(content: string): void {
    // Remove any existing preview
    this.hidePreview()

    const preview = document.createElement('div')
    preview.id = 'support-ai-auto-responder-preview'
    preview.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      animation: slideIn 0.3s ease-out;
    `

    const countdown = Math.floor(this.previewDelay / 1000)

    preview.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 20px; margin-right: 8px;">🤖</div>
        <div style="font-weight: 600; font-size: 15px;">YOLO Mode - Sending in ${countdown}s</div>
      </div>
      <div style="opacity: 0.95; font-size: 13px; max-height: 80px; overflow: hidden;">
        "${content.substring(0, 150)}${content.length > 150 ? '...' : ''}"
      </div>
    `

    // Add animation keyframe
    if (!document.getElementById('auto-responder-animations')) {
      const style = document.createElement('style')
      style.id = 'auto-responder-animations'
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(420px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(preview)
  }

  /**
   * Hide preview notification
   */
  private hidePreview(): void {
    const preview = document.getElementById('support-ai-auto-responder-preview')
    if (preview) {
      preview.remove()
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Set preview delay
   */
  setPreviewDelay(ms: number): void {
    this.previewDelay = ms
    logger.info(`Preview delay updated to ${ms}ms`)
  }

  /**
   * Get current preview delay
   */
  getPreviewDelay(): number {
    return this.previewDelay
  }
}
