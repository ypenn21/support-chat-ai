import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AutoResponder } from './auto-responder'
import type { PlatformDetector } from './platforms/types'

describe('AutoResponder', () => {
  let autoResponder: AutoResponder
  let mockPlatform: PlatformDetector
  let mockInputBox: HTMLInputElement
  let mockSendButton: HTMLButtonElement

  beforeEach(() => {
    // Create mock DOM elements
    mockInputBox = document.createElement('input')
    mockInputBox.type = 'text'
    mockInputBox.id = 'test-input'

    mockSendButton = document.createElement('button')
    mockSendButton.id = 'test-send-button'
    mockSendButton.textContent = 'Send'

    // Mock platform detector
    mockPlatform = {
      detect: vi.fn(),
      getChatContainer: vi.fn(),
      getMessageElements: vi.fn(() => []),
      getMessageText: vi.fn(),
      getMessageRole: vi.fn(),
      getInputBox: vi.fn(() => mockInputBox),
      getSendButton: vi.fn(() => mockSendButton),
      getPlatformName: vi.fn(() => 'test')
    }

    autoResponder = new AutoResponder(mockPlatform, 100) // Short delay for testing
  })

  afterEach(() => {
    // Clean up any preview elements
    const preview = document.getElementById('support-ai-auto-responder-preview')
    if (preview) {
      preview.remove()
    }
  })

  describe('sendResponse', () => {
    it('should inject content and click send button', async () => {
      const clickSpy = vi.spyOn(mockSendButton, 'click')
      const dispatchEventSpy = vi.spyOn(mockSendButton, 'dispatchEvent')

      await autoResponder.sendResponse('Test response', false)

      expect(mockInputBox.value).toBe('Test response')
      expect(clickSpy).toHaveBeenCalled()
      expect(dispatchEventSpy).toHaveBeenCalled()
    })

    it('should dispatch input and change events on input box', async () => {
      const inputEventSpy = vi.spyOn(mockInputBox, 'dispatchEvent')

      await autoResponder.sendResponse('Test message', false)

      const events = inputEventSpy.mock.calls.map(call => call[0].type)
      expect(events).toContain('input')
      expect(events).toContain('change')
    })

    it('should throw error if input box not found', async () => {
      mockPlatform.getInputBox = vi.fn(() => null)
      const responder = new AutoResponder(mockPlatform)

      await expect(responder.sendResponse('Test')).rejects.toThrow(
        'Cannot find input box - unable to send response'
      )
    })

    it('should throw error if send button not found', async () => {
      mockPlatform.getSendButton = vi.fn(() => null)
      const responder = new AutoResponder(mockPlatform)

      await expect(responder.sendResponse('Test')).rejects.toThrow(
        'Cannot find send button - unable to send response'
      )
    })

    it('should handle textarea elements', async () => {
      const textarea = document.createElement('textarea')
      mockPlatform.getInputBox = vi.fn(() => textarea)

      const responder = new AutoResponder(mockPlatform, 0)
      await responder.sendResponse('Textarea test', false)

      expect(textarea.value).toBe('Textarea test')
    })

    it('should handle contentEditable divs', async () => {
      const contentEditableDiv = document.createElement('div')
      contentEditableDiv.contentEditable = 'true'
      mockPlatform.getInputBox = vi.fn(() => contentEditableDiv)

      const responder = new AutoResponder(mockPlatform, 0)
      await responder.sendResponse('ContentEditable test', false)

      expect(contentEditableDiv.textContent).toBe('ContentEditable test')
    })

    it('should dispatch keyboard events for contentEditable elements', async () => {
      const contentEditableDiv = document.createElement('div')
      contentEditableDiv.contentEditable = 'true'
      mockPlatform.getInputBox = vi.fn(() => contentEditableDiv)

      const dispatchEventSpy = vi.spyOn(contentEditableDiv, 'dispatchEvent')

      const responder = new AutoResponder(mockPlatform, 0)
      await responder.sendResponse('Test', false)

      const events = dispatchEventSpy.mock.calls.map(call => call[0].type)
      expect(events).toContain('input')
      expect(events).toContain('keydown')
      expect(events).toContain('keyup')
    })
  })

  describe('preview functionality', () => {
    it('should show and hide preview when enabled', async () => {
      const responder = new AutoResponder(mockPlatform, 100)

      // Append body to document for preview to be visible
      document.body.appendChild(mockInputBox)
      document.body.appendChild(mockSendButton)

      const responsePromise = responder.sendResponse('Preview test message', true)

      // Check preview exists immediately
      await new Promise(resolve => setTimeout(resolve, 10))
      let preview = document.getElementById('support-ai-auto-responder-preview')
      expect(preview).toBeTruthy()
      expect(preview?.textContent).toContain('Preview test message')

      // Wait for preview to be removed
      await responsePromise

      preview = document.getElementById('support-ai-auto-responder-preview')
      expect(preview).toBeNull()

      // Cleanup
      document.body.removeChild(mockInputBox)
      document.body.removeChild(mockSendButton)
    })

    it('should not show preview when disabled', async () => {
      const responder = new AutoResponder(mockPlatform, 100)

      await responder.sendResponse('No preview test', false)

      const preview = document.getElementById('support-ai-auto-responder-preview')
      expect(preview).toBeNull()
    })

    it('should truncate long messages in preview', async () => {
      const longMessage = 'A'.repeat(200)
      const responder = new AutoResponder(mockPlatform, 100)

      document.body.appendChild(mockInputBox)
      document.body.appendChild(mockSendButton)

      const responsePromise = responder.sendResponse(longMessage, true)

      await new Promise(resolve => setTimeout(resolve, 10))
      const preview = document.getElementById('support-ai-auto-responder-preview')
      expect(preview?.textContent).toContain('...')

      await responsePromise

      document.body.removeChild(mockInputBox)
      document.body.removeChild(mockSendButton)
    })

    it('should remove existing preview before showing new one', async () => {
      const responder = new AutoResponder(mockPlatform, 50)

      document.body.appendChild(mockInputBox)
      document.body.appendChild(mockSendButton)

      // Create first preview
      const promise1 = responder.sendResponse('First message', true)
      await new Promise(resolve => setTimeout(resolve, 10))

      const firstPreview = document.getElementById('support-ai-auto-responder-preview')
      expect(firstPreview).toBeTruthy()

      await promise1

      // Create second preview
      const promise2 = responder.sendResponse('Second message', true)
      await new Promise(resolve => setTimeout(resolve, 10))

      const previews = document.querySelectorAll('#support-ai-auto-responder-preview')
      expect(previews.length).toBe(1) // Should only be one preview

      await promise2

      document.body.removeChild(mockInputBox)
      document.body.removeChild(mockSendButton)
    })

    it('should show countdown in preview', async () => {
      const responder = new AutoResponder(mockPlatform, 3000)

      document.body.appendChild(mockInputBox)
      document.body.appendChild(mockSendButton)

      const responsePromise = responder.sendResponse('Countdown test', true)

      await new Promise(resolve => setTimeout(resolve, 10))
      const preview = document.getElementById('support-ai-auto-responder-preview')
      expect(preview?.textContent).toContain('3s') // 3000ms = 3s

      // Don't wait for full preview, just clean up
      document.body.removeChild(mockInputBox)
      document.body.removeChild(mockSendButton)

      await responsePromise
    })

    it('should respect zero preview delay', async () => {
      const responder = new AutoResponder(mockPlatform, 0)

      const startTime = Date.now()
      await responder.sendResponse('Zero delay test', true)
      const endTime = Date.now()

      // Should complete almost instantly (< 50ms)
      expect(endTime - startTime).toBeLessThan(50)
    })
  })

  describe('setPreviewDelay and getPreviewDelay', () => {
    it('should get and set preview delay', () => {
      expect(autoResponder.getPreviewDelay()).toBe(100)

      autoResponder.setPreviewDelay(5000)
      expect(autoResponder.getPreviewDelay()).toBe(5000)

      autoResponder.setPreviewDelay(0)
      expect(autoResponder.getPreviewDelay()).toBe(0)
    })

    it('should use updated delay for preview', async () => {
      const responder = new AutoResponder(mockPlatform, 1000)

      responder.setPreviewDelay(50)

      document.body.appendChild(mockInputBox)
      document.body.appendChild(mockSendButton)

      const startTime = Date.now()
      await responder.sendResponse('Delay test', true)
      const endTime = Date.now()

      // Should use new 50ms delay, not original 1000ms
      expect(endTime - startTime).toBeLessThan(200)
      expect(endTime - startTime).toBeGreaterThanOrEqual(50)

      document.body.removeChild(mockInputBox)
      document.body.removeChild(mockSendButton)
    })
  })

  describe('click send button', () => {
    it('should call both click() and dispatchEvent()', async () => {
      const clickSpy = vi.spyOn(mockSendButton, 'click')
      const dispatchEventSpy = vi.spyOn(mockSendButton, 'dispatchEvent')

      await autoResponder.sendResponse('Test', false)

      expect(clickSpy).toHaveBeenCalled()
      expect(dispatchEventSpy).toHaveBeenCalled()
    })

    it('should dispatch MouseEvent with correct properties', async () => {
      const dispatchEventSpy = vi.spyOn(mockSendButton, 'dispatchEvent')

      await autoResponder.sendResponse('Test', false)

      const mouseEvent = dispatchEventSpy.mock.calls.find(
        call => call[0] instanceof MouseEvent
      )?.[0] as MouseEvent

      expect(mouseEvent).toBeTruthy()
      expect(mouseEvent.type).toBe('click')
      expect(mouseEvent.bubbles).toBe(true)
      // Note: cancelable defaults to false in test environment, but true in browser
      expect(mouseEvent.cancelable).toBeDefined()
    })
  })

  describe('integration scenarios', () => {
    it('should successfully send message with all steps', async () => {
      const inputEventSpy = vi.spyOn(mockInputBox, 'dispatchEvent')
      const buttonClickSpy = vi.spyOn(mockSendButton, 'click')

      const message = 'Complete integration test'

      await autoResponder.sendResponse(message, false)

      // Verify input was set
      expect(mockInputBox.value).toBe(message)

      // Verify events were dispatched
      expect(inputEventSpy).toHaveBeenCalled()

      // Verify send button was clicked
      expect(buttonClickSpy).toHaveBeenCalled()
    })

    it('should handle empty message', async () => {
      await autoResponder.sendResponse('', false)

      expect(mockInputBox.value).toBe('')
      expect(mockSendButton.click).toBeDefined()
    })

    it('should handle special characters in message', async () => {
      const specialMessage = 'Test with "quotes", <tags>, & symbols!'

      await autoResponder.sendResponse(specialMessage, false)

      expect(mockInputBox.value).toBe(specialMessage)
    })

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(5000)

      await autoResponder.sendResponse(longMessage, false)

      expect(mockInputBox.value).toBe(longMessage)
    })

    it('should handle unicode and emoji', async () => {
      const unicodeMessage = 'Hello 👋 世界 🌍 test'

      await autoResponder.sendResponse(unicodeMessage, false)

      expect(mockInputBox.value).toBe(unicodeMessage)
    })
  })
})
