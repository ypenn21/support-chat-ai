import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Message, YoloState, AutonomousResponse, SuggestResponse } from '@/types'

// Mock all dependencies
vi.mock('./platforms', () => ({
  waitForPlatform: vi.fn(),
  detectPlatformType: vi.fn(() => 'zendesk')
}))

vi.mock('./dom-observer', () => ({
  createChatObserver: vi.fn(),
  waitForChatContainer: vi.fn()
}))

vi.mock('./ui-injector', () => ({
  mountSuggestionPanel: vi.fn(),
  showLoadingPanel: vi.fn(() => vi.fn()), // Returns cleanup function
  showErrorPanel: vi.fn(),
  unmountSuggestionPanel: vi.fn()
}))

vi.mock('@/lib/storage', () => ({
  getMode: vi.fn(),
  getYoloState: vi.fn()
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }))
}))

vi.mock('@/lib/error-handler', () => ({
  setupGlobalErrorHandler: vi.fn(),
  formatErrorForUser: vi.fn((error) => String(error))
}))

vi.mock('./auto-responder', () => ({
  AutoResponder: vi.fn().mockImplementation(() => ({
    sendResponse: vi.fn().mockResolvedValue(undefined)
  }))
}))

vi.mock('./safety-monitor', () => ({
  SafetyMonitor: vi.fn().mockImplementation(() => ({
    checkMessage: vi.fn().mockReturnValue({ shouldEscalate: false }),
    checkConfidence: vi.fn().mockReturnValue(true)
  }))
}))

describe('Content Script Integration', () => {
  let mockPlatform: any
  let mockChatContainer: HTMLElement
  let handleNewMessages: (messages: Message[]) => void

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock platform
    mockPlatform = {
      detect: vi.fn(() => true),
      getChatContainer: vi.fn(),
      getMessageElements: vi.fn(() => []),
      getMessageText: vi.fn(),
      getMessageRole: vi.fn(),
      getInputBox: vi.fn(),
      getSendButton: vi.fn(),
      getPlatformName: vi.fn(() => 'zendesk')
    }

    // Mock chat container
    mockChatContainer = document.createElement('div')
    mockChatContainer.id = 'test-chat-container'

    // Mock chrome.runtime
    globalThis.chrome = {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({}),
        onMessage: {
          addListener: vi.fn()
        }
      }
    } as any

    // Mock window.addEventListener
    vi.spyOn(window, 'addEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize in suggestion mode when no YOLO state exists', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')

      vi.mocked(getMode).mockResolvedValue('suggestion')
      vi.mocked(getYoloState).mockResolvedValue(null)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(createChatObserver).mockReturnValue(vi.fn())

      // Dynamically import to trigger initialization
      await import('./index')

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(waitForPlatform).toHaveBeenCalledWith(10000)
      expect(waitForChatContainer).toHaveBeenCalledWith(mockPlatform, 10000)
      expect(createChatObserver).toHaveBeenCalled()
    })

    it('should initialize in YOLO mode when YOLO state exists', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')
      const { AutoResponder } = await import('./auto-responder')
      const { SafetyMonitor } = await import('./safety-monitor')

      const mockYoloState: YoloState = {
        active: true,
        goal: {
          type: 'resolve_issue',
          description: 'Test goal',
          required_info: ['order_number'],
          max_turns: 10
        },
        goalState: {
          current_step: 'waiting',
          turns_taken: 0,
          info_gathered: [],
          started_at: Date.now(),
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: ['angry', 'manager'],
          stop_if_confused: true
        },
        conversationId: 'test-conv-id'
      }

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(createChatObserver).mockReturnValue(vi.fn())

      // Clear previous module cache
      vi.resetModules()

      // Dynamically import to trigger initialization
      await import('./index')

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(AutoResponder).toHaveBeenCalledWith(mockPlatform, 3000)
      expect(SafetyMonitor).toHaveBeenCalledWith(mockYoloState.safetyConstraints)
    })

    it('should not activate if no platform detected', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { createChatObserver } = await import('./dom-observer')
      const { getMode } = await import('@/lib/storage')

      vi.mocked(getMode).mockResolvedValue('suggestion')
      vi.mocked(waitForPlatform).mockResolvedValue(null)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(createChatObserver).not.toHaveBeenCalled()
    })

    it('should not activate if chat container not found', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode } = await import('@/lib/storage')

      vi.mocked(getMode).mockResolvedValue('suggestion')
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(null)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(createChatObserver).not.toHaveBeenCalled()
    })
  })

  describe('Suggestion Mode Flow', () => {
    it('should handle suggestion mode message flow', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode } = await import('@/lib/storage')
      const { mountSuggestionPanel, showLoadingPanel } = await import('./ui-injector')

      const messages: Message[] = [
        { role: 'customer', content: 'I need help with my order', timestamp: Date.now() }
      ]

      const mockSuggestion: SuggestResponse = {
        suggestions: [{
          id: 'sug-1',
          content: 'I can help you with that.',
          confidence: 0.9,
          reasoning: 'Test reasoning'
        }],
        metadata: {
          model_used: 'test-model',
          latency: 1.0,
          token_count: 180
        }
      }

      vi.mocked(getMode).mockResolvedValue('suggestion')
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(showLoadingPanel).mockReturnValue(vi.fn())

      // Capture the handleNewMessages callback
      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(mockSuggestion)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Trigger message handling
      await handleNewMessages(messages)

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_SUGGESTION',
        payload: {
          platform: 'zendesk',
          conversation_context: messages
        }
      })

      expect(mountSuggestionPanel).toHaveBeenCalledWith(
        mockSuggestion.suggestions[0],
        expect.objectContaining({
          onCopy: expect.any(Function),
          onDismiss: expect.any(Function),
          position: 'bottom-right'
        })
      )
    })

    it('should show error panel if no suggestions returned', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode } = await import('@/lib/storage')
      const { showErrorPanel } = await import('./ui-injector')

      const messages: Message[] = [
        { role: 'customer', content: 'Hello', timestamp: Date.now() }
      ]

      vi.mocked(getMode).mockResolvedValue('suggestion')
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.mocked(chrome.runtime.sendMessage).mockResolvedValue({
        suggestions: [],
        metadata: { model_used: 'test', latency: 1.0, token_count: 50 }
      })

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      await handleNewMessages(messages)

      expect(showErrorPanel).toHaveBeenCalledWith('No suggestions available at this time')
    })

    it('should handle background worker errors gracefully', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode } = await import('@/lib/storage')
      const { showErrorPanel } = await import('./ui-injector')

      const messages: Message[] = [
        { role: 'customer', content: 'Test', timestamp: Date.now() }
      ]

      vi.mocked(getMode).mockResolvedValue('suggestion')
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.mocked(chrome.runtime.sendMessage).mockRejectedValue(new Error('Connection failed'))

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      await handleNewMessages(messages)

      expect(showErrorPanel).toHaveBeenCalledWith('Failed to get AI suggestion. Please try again.')
    })
  })

  describe('YOLO Mode Flow', () => {
    let mockYoloState: YoloState
    let mockSafetyMonitor: any
    let mockAutoResponder: any

    beforeEach(() => {
      mockYoloState = {
        active: true,
        goal: {
          type: 'resolve_issue',
          description: 'Resolve order issue',
          required_info: ['order_number'],
          max_turns: 10
        },
        goalState: {
          current_step: 'waiting',
          turns_taken: 0,
          info_gathered: [],
          started_at: Date.now(),
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: ['angry', 'manager'],
          min_confidence: 0.7,
          stop_if_confused: true
        },
        conversationId: 'test-conv'
      }

      mockSafetyMonitor = {
        checkMessage: vi.fn().mockReturnValue({ shouldEscalate: false }),
        checkConfidence: vi.fn().mockReturnValue(true)
      }

      mockAutoResponder = {
        sendResponse: vi.fn().mockResolvedValue(undefined)
      }
    })

    it('should handle YOLO mode respond action', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')
      const { SafetyMonitor } = await import('./safety-monitor')
      const { AutoResponder } = await import('./auto-responder')

      const messages: Message[] = [
        { role: 'customer', content: 'I need help', timestamp: Date.now() }
      ]

      const mockResponse: AutonomousResponse = {
        action: 'respond',
        response: {
          id: 'resp-1',
          content: 'I can help you with that.',
          confidence: 0.85
        },
        goal_state: {
          ...mockYoloState.goalState,
          turns_taken: 1
        },
        metadata: {
          model_used: 'test-model',
          latency: 1.0,
          token_count: 200
        }
      }

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(SafetyMonitor).mockReturnValue(mockSafetyMonitor)
      vi.mocked(AutoResponder).mockReturnValue(mockAutoResponder)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(mockResponse)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      await handleNewMessages(messages)

      expect(mockSafetyMonitor.checkMessage).toHaveBeenCalledWith(
        messages[messages.length - 1],
        mockYoloState.goalState
      )

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_AUTONOMOUS_RESPONSE',
        payload: {
          platform: 'zendesk',
          conversation_context: messages,
          goal: mockYoloState.goal,
          goal_state: mockYoloState.goalState,
          safety_constraints: mockYoloState.safetyConstraints
        }
      })

      expect(mockAutoResponder.sendResponse).toHaveBeenCalledWith(
        mockResponse.response!.content,
        true
      )

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_GOAL_STATE',
        payload: { goalState: mockResponse.goal_state }
      })

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'CONVERSATION_UPDATE',
        payload: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'agent',
              content: mockResponse.response!.content
            })
          ])
        })
      })
    })

    it('should escalate when safety check fails', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')
      const { SafetyMonitor } = await import('./safety-monitor')
      const { AutoResponder } = await import('./auto-responder')
      const { showErrorPanel } = await import('./ui-injector')

      const messages: Message[] = [
        { role: 'customer', content: 'I want to speak to your manager!', timestamp: Date.now() }
      ]

      mockSafetyMonitor.checkMessage.mockReturnValue({
        shouldEscalate: true,
        reason: 'Escalation keyword detected'
      })

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(SafetyMonitor).mockReturnValue(mockSafetyMonitor)
      vi.mocked(AutoResponder).mockReturnValue(mockAutoResponder)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      await handleNewMessages(messages)

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SET_MODE',
        payload: { mode: 'suggestion' }
      })

      expect(showErrorPanel).toHaveBeenCalledWith(
        'Escalated: Escalation keyword detected. Switching to manual mode.'
      )

      expect(mockAutoResponder.sendResponse).not.toHaveBeenCalled()
    })

    it('should escalate when confidence too low', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')
      const { SafetyMonitor } = await import('./safety-monitor')
      const { AutoResponder } = await import('./auto-responder')
      const { showErrorPanel } = await import('./ui-injector')

      const messages: Message[] = [
        { role: 'customer', content: 'Help', timestamp: Date.now() }
      ]

      const mockResponse: AutonomousResponse = {
        action: 'respond',
        response: {
          id: 'resp-1',
          content: 'Test response',
          confidence: 0.5  // Low confidence
        },
        goal_state: mockYoloState.goalState,
        metadata: { model_used: 'test', latency: 1.0, token_count: 100 }
      }

      mockSafetyMonitor.checkConfidence.mockReturnValue(false)

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(SafetyMonitor).mockReturnValue(mockSafetyMonitor)
      vi.mocked(AutoResponder).mockReturnValue(mockAutoResponder)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(mockResponse)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      await handleNewMessages(messages)

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SET_MODE',
        payload: { mode: 'suggestion' }
      })

      expect(showErrorPanel).toHaveBeenCalledWith(
        'Escalated: AI confidence too low. Switching to manual mode.'
      )

      expect(mockAutoResponder.sendResponse).not.toHaveBeenCalled()
    })

    it('should handle escalate action from AI', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')
      const { SafetyMonitor } = await import('./safety-monitor')
      const { AutoResponder } = await import('./auto-responder')
      const { showErrorPanel } = await import('./ui-injector')

      const messages: Message[] = [
        { role: 'customer', content: 'Complex issue', timestamp: Date.now() }
      ]

      const mockResponse: AutonomousResponse = {
        action: 'escalate',
        reason: 'Issue too complex for AI',
        goal_state: mockYoloState.goalState,
        metadata: { model_used: 'test', latency: 1.0, token_count: 80 }
      }

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(SafetyMonitor).mockReturnValue(mockSafetyMonitor)
      vi.mocked(AutoResponder).mockReturnValue(mockAutoResponder)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(mockResponse)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      await handleNewMessages(messages)

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SET_MODE',
        payload: { mode: 'suggestion' }
      })

      expect(showErrorPanel).toHaveBeenCalledWith(
        'Escalated: Issue too complex for AI. Switching to manual mode.'
      )
    })

    it('should handle goal_complete action', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')
      const { SafetyMonitor } = await import('./safety-monitor')
      const { AutoResponder } = await import('./auto-responder')

      const messages: Message[] = [
        { role: 'customer', content: 'Thanks!', timestamp: Date.now() }
      ]

      const mockResponse: AutonomousResponse = {
        action: 'goal_complete',
        reason: 'All information gathered',
        goal_state: mockYoloState.goalState,
        metadata: { model_used: 'test', latency: 1.0, token_count: 60 }
      }

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(SafetyMonitor).mockReturnValue(mockSafetyMonitor)
      vi.mocked(AutoResponder).mockReturnValue(mockAutoResponder)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(mockResponse)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      await handleNewMessages(messages)

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SET_MODE',
        payload: { mode: 'suggestion' }
      })
    })

    it('should handle need_info action (wait for more messages)', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')
      const { SafetyMonitor } = await import('./safety-monitor')
      const { AutoResponder } = await import('./auto-responder')

      const messages: Message[] = [
        { role: 'customer', content: 'Hello', timestamp: Date.now() }
      ]

      const mockResponse: AutonomousResponse = {
        action: 'need_info',
        reason: 'Waiting for customer to provide details',
        goal_state: mockYoloState.goalState,
        metadata: { model_used: 'test', latency: 1.0, token_count: 70 }
      }

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(SafetyMonitor).mockReturnValue(mockSafetyMonitor)
      vi.mocked(AutoResponder).mockReturnValue(mockAutoResponder)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(mockResponse)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      await handleNewMessages(messages)

      // Should not send response or change mode
      expect(mockAutoResponder.sendResponse).not.toHaveBeenCalled()
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_MODE' })
      )
    })

    it('should escalate on error during YOLO mode', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode, getYoloState } = await import('@/lib/storage')
      const { SafetyMonitor } = await import('./safety-monitor')
      const { AutoResponder } = await import('./auto-responder')
      const { showErrorPanel } = await import('./ui-injector')

      const messages: Message[] = [
        { role: 'customer', content: 'Help', timestamp: Date.now() }
      ]

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(SafetyMonitor).mockReturnValue(mockSafetyMonitor)
      vi.mocked(AutoResponder).mockReturnValue(mockAutoResponder)

      vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {
        handleNewMessages = callback
        return vi.fn()
      })

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Mock sendMessage to reject ONLY when getting autonomous response
      vi.mocked(chrome.runtime.sendMessage).mockImplementation(((message: any) => {
        if (message.type === 'GET_AUTONOMOUS_RESPONSE') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({})
      }) as any)

      await handleNewMessages(messages)

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SET_MODE',
        payload: { mode: 'suggestion' }
      })

      expect(showErrorPanel).toHaveBeenCalledWith(
        expect.stringContaining('Error: Error: Network error')
      )
    })
  })

  describe('Runtime Messages', () => {
    let messageListener: (message: any) => void

    beforeEach(() => {
      vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation((listener: any) => {
        messageListener = listener
      })
    })

    it('should handle MODE_CHANGED message and reinitialize', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode } = await import('@/lib/storage')

      const mockCleanup = vi.fn()

      vi.mocked(getMode).mockResolvedValue('suggestion')
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(createChatObserver).mockReturnValue(mockCleanup)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Send MODE_CHANGED message
      messageListener({ type: 'MODE_CHANGED', payload: { mode: 'yolo' } })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockCleanup).toHaveBeenCalled()
    })

    it('should handle EMERGENCY_STOP message', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode } = await import('@/lib/storage')
      const { showErrorPanel } = await import('./ui-injector')

      vi.mocked(getMode).mockResolvedValue('yolo')
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(createChatObserver).mockReturnValue(vi.fn())

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Send EMERGENCY_STOP message
      messageListener({ type: 'EMERGENCY_STOP' })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SET_MODE',
        payload: { mode: 'suggestion' }
      })

      expect(showErrorPanel).toHaveBeenCalledWith(
        'Escalated: Emergency stop activated by user. Switching to manual mode.'
      )
    })
  })

  describe('Cleanup', () => {
    it('should cleanup observer on page unload', async () => {
      const { waitForPlatform } = await import('./platforms')
      const { waitForChatContainer, createChatObserver } = await import('./dom-observer')
      const { getMode } = await import('@/lib/storage')
      const { unmountSuggestionPanel } = await import('./ui-injector')

      const mockCleanup = vi.fn()

      vi.mocked(getMode).mockResolvedValue('suggestion')
      vi.mocked(waitForPlatform).mockResolvedValue(mockPlatform)
      vi.mocked(waitForChatContainer).mockResolvedValue(mockChatContainer)
      vi.mocked(createChatObserver).mockReturnValue(mockCleanup)

      vi.resetModules()
      await import('./index')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Trigger beforeunload event
      const beforeUnloadEvent = new Event('beforeunload')
      window.dispatchEvent(beforeUnloadEvent)

      expect(mockCleanup).toHaveBeenCalled()
      expect(unmountSuggestionPanel).toHaveBeenCalled()
    })
  })
})
