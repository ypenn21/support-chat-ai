import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleMessage } from './message-router'
import type { RuntimeMessage, SuggestRequest, AutonomousRequest, UserPreferences, Goal, SafetyConstraints, GoalState } from '@/types'

// Mock dependencies
vi.mock('./api-client', () => ({
  fetchSuggestion: vi.fn(),
  validateSuggestionRequest: vi.fn(() => true)
}))

vi.mock('@/lib/storage', () => ({
  getPreferences: vi.fn(),
  savePreferences: vi.fn(),
  getMode: vi.fn(),
  setMode: vi.fn(),
  getYoloState: vi.fn(),
  saveYoloState: vi.fn()
}))

vi.mock('@/lib/error-handler', () => ({
  formatErrorForUser: vi.fn((error) => String(error))
}))

vi.mock('@/lib/mock-api', () => ({
  getAutonomousResponse: vi.fn()
}))

vi.mock('./mode-controller', () => ({
  ModeController: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    emergencyStop: vi.fn().mockResolvedValue(undefined)
  }))
}))

vi.mock('./goal-tracker', () => ({
  GoalTracker: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    setGoal: vi.fn().mockResolvedValue(undefined)
  }))
}))

describe('Message Router Integration', () => {
  let mockSender: chrome.runtime.MessageSender
  let sendResponseSpy: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Re-set default mock implementations after clearing
    const { validateSuggestionRequest } = await import('./api-client')
    vi.mocked(validateSuggestionRequest).mockReturnValue(true)

    mockSender = {
      id: 'test-extension-id',
      url: 'https://test.zendesk.com',
      tab: {
        id: 123,
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: true,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1
      }
    }

    sendResponseSpy = vi.fn()

    // Mock chrome.tabs
    globalThis.chrome = {
      tabs: {
        query: vi.fn((queryInfo, callback) => {
          callback([mockSender.tab!])
        }),
        sendMessage: vi.fn().mockResolvedValue({})
      }
    } as any
  })

  describe('GET_SUGGESTION', () => {
    it('should handle GET_SUGGESTION message successfully', async () => {
      const { fetchSuggestion } = await import('./api-client')
      const { getPreferences } = await import('@/lib/storage')

      const mockPreferences: UserPreferences = {
        tone: 'professional',
        length: 'medium',
        language: 'en'
      }

      const mockResponse = {
        suggestions: [{
          id: 'sug-1',
          content: 'Test suggestion',
          confidence: 0.9,
          reasoning: 'Test reasoning'
        }],
        metadata: {
          model_used: 'test-model',
          latency: 1.0
        }
      }

      vi.mocked(getPreferences).mockResolvedValue(mockPreferences)
      vi.mocked(fetchSuggestion).mockResolvedValue(mockResponse)

      const message: RuntimeMessage = {
        type: 'GET_SUGGESTION',
        payload: {
          platform: 'zendesk',
          conversation_context: [
            { role: 'customer', content: 'I need help', timestamp: Date.now() }
          ]
        }
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true) // Should return true for async response

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(getPreferences).toHaveBeenCalled()
      expect(fetchSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'zendesk',
          user_preferences: mockPreferences
        })
      )
      expect(sendResponseSpy).toHaveBeenCalledWith(mockResponse)
    })

    it('should handle GET_SUGGESTION with validation error', async () => {
      const { validateSuggestionRequest } = await import('./api-client')

      vi.mocked(validateSuggestionRequest).mockReturnValue(false)

      const message: RuntimeMessage = {
        type: 'GET_SUGGESTION',
        payload: {}
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Invalid suggestion request format'
      })
    })

    it('should handle GET_SUGGESTION with API error', async () => {
      const { fetchSuggestion } = await import('./api-client')
      const { getPreferences } = await import('@/lib/storage')

      vi.mocked(getPreferences).mockResolvedValue(null)
      vi.mocked(fetchSuggestion).mockRejectedValue(new Error('API Error'))

      const message: RuntimeMessage = {
        type: 'GET_SUGGESTION',
        payload: {
          platform: 'zendesk',
          conversation_context: []
        }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: API Error'
      })
    })
  })

  describe('GET_AUTONOMOUS_RESPONSE', () => {
    it('should handle GET_AUTONOMOUS_RESPONSE successfully', async () => {
      const { getAutonomousResponse } = await import('@/lib/mock-api')

      const mockRequest: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          { role: 'customer', content: 'Help me', timestamp: Date.now() }
        ],
        goal: {
          type: 'resolve_issue',
          description: 'Test goal',
          required_info: ['order_number'],
          max_turns: 10
        },
        goal_state: {
          current_step: 'waiting',
          turns_taken: 0,
          info_gathered: [],
          last_updated: Date.now()
        },
        safety_constraints: {
          max_turns: 10,
          escalation_keywords: ['angry'],
          stop_if_confused: true
        }
      }

      const mockResponse = {
        action: 'respond' as const,
        response: {
          id: 'resp-1',
          content: 'I can help',
          confidence: 0.85
        },
        goal_state: mockRequest.goal_state,
        metadata: {
          model_used: 'test',
          latency: 1.0
        }
      }

      vi.mocked(getAutonomousResponse).mockResolvedValue(mockResponse)

      const message: RuntimeMessage = {
        type: 'GET_AUTONOMOUS_RESPONSE',
        payload: mockRequest
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(getAutonomousResponse).toHaveBeenCalledWith(mockRequest)
      expect(sendResponseSpy).toHaveBeenCalledWith(mockResponse)
    })

    it('should handle GET_AUTONOMOUS_RESPONSE with error', async () => {
      const { getAutonomousResponse } = await import('@/lib/mock-api')

      vi.mocked(getAutonomousResponse).mockRejectedValue(new Error('AI Error'))

      const message: RuntimeMessage = {
        type: 'GET_AUTONOMOUS_RESPONSE',
        payload: {
          platform: 'zendesk',
          conversation_context: [],
          goal: { type: 'resolve_issue', description: 'Test', max_turns: 10 },
          goal_state: { current_step: 'waiting', turns_taken: 0, info_gathered: [], last_updated: Date.now() },
          safety_constraints: { max_turns: 10, escalation_keywords: [], stop_if_confused: true }
        }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: AI Error'
      })
    })
  })

  describe('SET_MODE', () => {
    it('should set mode and broadcast to all tabs', async () => {
      const { setMode } = await import('@/lib/storage')

      vi.mocked(setMode).mockResolvedValue(undefined)

      const message: RuntimeMessage = {
        type: 'SET_MODE',
        payload: { mode: 'yolo' }
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(setMode).toHaveBeenCalledWith('yolo')
      expect(chrome.tabs.query).toHaveBeenCalledWith({}, expect.any(Function))
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        {
          type: 'MODE_CHANGED',
          payload: { mode: 'yolo' }
        }
      )
      expect(sendResponseSpy).toHaveBeenCalledWith({
        success: true,
        mode: 'yolo'
      })
    })

    it('should handle SET_MODE error gracefully', async () => {
      const { setMode } = await import('@/lib/storage')

      vi.mocked(setMode).mockRejectedValue(new Error('Storage error'))

      const message: RuntimeMessage = {
        type: 'SET_MODE',
        payload: { mode: 'suggestion' }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: Storage error'
      })
    })

    it('should handle broadcast errors gracefully', async () => {
      const { setMode } = await import('@/lib/storage')

      vi.mocked(setMode).mockResolvedValue(undefined)
      vi.mocked(chrome.tabs.sendMessage).mockRejectedValue(new Error('Tab not found'))

      const message: RuntimeMessage = {
        type: 'SET_MODE',
        payload: { mode: 'yolo' }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      // Should still succeed even if broadcast fails
      expect(sendResponseSpy).toHaveBeenCalledWith({
        success: true,
        mode: 'yolo'
      })
    })
  })

  describe('GET_MODE', () => {
    it('should return current mode', async () => {
      const { getMode } = await import('@/lib/storage')

      vi.mocked(getMode).mockResolvedValue('suggestion')

      const message: RuntimeMessage = {
        type: 'GET_MODE',
        payload: undefined
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(getMode).toHaveBeenCalled()
      expect(sendResponseSpy).toHaveBeenCalledWith({ mode: 'suggestion' })
    })

    it('should handle GET_MODE error', async () => {
      const { getMode } = await import('@/lib/storage')

      vi.mocked(getMode).mockRejectedValue(new Error('Storage error'))

      const message: RuntimeMessage = {
        type: 'GET_MODE',
        payload: undefined
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: Storage error'
      })
    })
  })

  describe('SET_GOAL', () => {
    it('should set goal successfully', async () => {
      const { GoalTracker } = await import('./goal-tracker')

      const mockGoal: Goal = {
        type: 'resolve_issue',
        description: 'Resolve shipping delay',
        required_info: ['order_number'],
        max_turns: 10
      }

      const mockConstraints: SafetyConstraints = {
        max_turns: 10,
        escalation_keywords: ['angry', 'manager'],
        stop_if_confused: true
      }

      const message: RuntimeMessage = {
        type: 'SET_GOAL',
        payload: {
          goal: mockGoal,
          constraints: mockConstraints
        }
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(GoalTracker).toHaveBeenCalled()
      const goalTrackerInstance = vi.mocked(GoalTracker).mock.results[0].value
      expect(goalTrackerInstance.initialize).toHaveBeenCalled()
      expect(goalTrackerInstance.setGoal).toHaveBeenCalledWith(mockGoal, mockConstraints)
      expect(sendResponseSpy).toHaveBeenCalledWith({ success: true })
    })

    it('should handle SET_GOAL error', async () => {
      const { GoalTracker } = await import('./goal-tracker')

      vi.mocked(GoalTracker).mockImplementation(() => ({
        initialize: vi.fn().mockRejectedValue(new Error('Init failed')),
        setGoal: vi.fn()
      }) as any)

      const message: RuntimeMessage = {
        type: 'SET_GOAL',
        payload: {
          goal: { type: 'resolve_issue', description: 'Test', max_turns: 10 },
          constraints: { max_turns: 10, escalation_keywords: [], stop_if_confused: true }
        }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: Init failed'
      })
    })
  })

  describe('UPDATE_GOAL_STATE', () => {
    it('should update goal state successfully', async () => {
      const { getYoloState, saveYoloState } = await import('@/lib/storage')

      const mockYoloState = {
        active: true,
        goal: {
          type: 'resolve_issue' as const,
          description: 'Test',
          max_turns: 10
        },
        goalState: {
          current_step: 'waiting',
          turns_taken: 0,
          info_gathered: [],
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: [],
          stop_if_confused: true
        },
        conversationId: 'test-conv'
      }

      const updatedGoalState: GoalState = {
        current_step: 'responding',
        turns_taken: 1,
        info_gathered: ['order_number'],
        last_updated: Date.now()
      }

      vi.mocked(getYoloState).mockResolvedValue(mockYoloState)
      vi.mocked(saveYoloState).mockResolvedValue(undefined)

      const message: RuntimeMessage = {
        type: 'UPDATE_GOAL_STATE',
        payload: { goalState: updatedGoalState }
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(getYoloState).toHaveBeenCalled()
      expect(saveYoloState).toHaveBeenCalledWith({
        ...mockYoloState,
        goalState: updatedGoalState
      })
      expect(sendResponseSpy).toHaveBeenCalledWith({ success: true })
    })

    it('should handle UPDATE_GOAL_STATE when no YOLO state exists', async () => {
      const { getYoloState } = await import('@/lib/storage')

      vi.mocked(getYoloState).mockResolvedValue(null)

      const message: RuntimeMessage = {
        type: 'UPDATE_GOAL_STATE',
        payload: {
          goalState: {
            current_step: 'waiting',
            turns_taken: 0,
            info_gathered: [],
            last_updated: Date.now()
          }
        }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'No active YOLO state'
      })
    })

    it('should handle UPDATE_GOAL_STATE error', async () => {
      const { getYoloState } = await import('@/lib/storage')

      vi.mocked(getYoloState).mockRejectedValue(new Error('Storage error'))

      const message: RuntimeMessage = {
        type: 'UPDATE_GOAL_STATE',
        payload: {
          goalState: {
            current_step: 'waiting',
            turns_taken: 0,
            info_gathered: [],
            last_updated: Date.now()
          }
        }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: Storage error'
      })
    })
  })

  describe('EMERGENCY_STOP', () => {
    it('should execute emergency stop successfully', async () => {
      const { ModeController } = await import('./mode-controller')

      const message: RuntimeMessage = {
        type: 'EMERGENCY_STOP',
        payload: undefined
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(ModeController).toHaveBeenCalled()
      const controllerInstance = vi.mocked(ModeController).mock.results[0].value
      expect(controllerInstance.initialize).toHaveBeenCalled()
      expect(controllerInstance.emergencyStop).toHaveBeenCalled()
      expect(sendResponseSpy).toHaveBeenCalledWith({ success: true })
    })

    it('should handle EMERGENCY_STOP error', async () => {
      const { ModeController } = await import('./mode-controller')

      vi.mocked(ModeController).mockImplementation(() => ({
        initialize: vi.fn().mockResolvedValue(undefined),
        emergencyStop: vi.fn().mockRejectedValue(new Error('Stop failed'))
      }) as any)

      const message: RuntimeMessage = {
        type: 'EMERGENCY_STOP',
        payload: undefined
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: Stop failed'
      })
    })
  })

  describe('SAVE_PREFERENCES', () => {
    it('should save preferences successfully', async () => {
      const { savePreferences } = await import('@/lib/storage')

      const mockPreferences: UserPreferences = {
        tone: 'friendly',
        length: 'short',
        language: 'en'
      }

      vi.mocked(savePreferences).mockResolvedValue(undefined)

      const message: RuntimeMessage = {
        type: 'SAVE_PREFERENCES',
        payload: mockPreferences
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(savePreferences).toHaveBeenCalledWith(mockPreferences)
      expect(sendResponseSpy).toHaveBeenCalledWith({ success: true })
    })

    it('should handle SAVE_PREFERENCES error', async () => {
      const { savePreferences } = await import('@/lib/storage')

      vi.mocked(savePreferences).mockRejectedValue(new Error('Save failed'))

      const message: RuntimeMessage = {
        type: 'SAVE_PREFERENCES',
        payload: { tone: 'professional', length: 'medium', language: 'en' }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: Save failed'
      })
    })
  })

  describe('GET_PREFERENCES', () => {
    it('should get preferences successfully', async () => {
      const { getPreferences } = await import('@/lib/storage')

      const mockPreferences: UserPreferences = {
        tone: 'casual',
        length: 'long',
        language: 'es'
      }

      vi.mocked(getPreferences).mockResolvedValue(mockPreferences)

      const message: RuntimeMessage = {
        type: 'GET_PREFERENCES',
        payload: undefined
      }

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(getPreferences).toHaveBeenCalled()
      expect(sendResponseSpy).toHaveBeenCalledWith({ preferences: mockPreferences })
    })

    it('should handle GET_PREFERENCES when no preferences exist', async () => {
      const { getPreferences } = await import('@/lib/storage')

      vi.mocked(getPreferences).mockResolvedValue(null)

      const message: RuntimeMessage = {
        type: 'GET_PREFERENCES',
        payload: undefined
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({ preferences: null })
    })

    it('should handle GET_PREFERENCES error', async () => {
      const { getPreferences } = await import('@/lib/storage')

      vi.mocked(getPreferences).mockRejectedValue(new Error('Read error'))

      const message: RuntimeMessage = {
        type: 'GET_PREFERENCES',
        payload: undefined
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Error: Read error'
      })
    })
  })

  describe('Unknown Message Type', () => {
    it('should handle unknown message type', () => {
      const message = {
        type: 'UNKNOWN_MESSAGE_TYPE',
        payload: undefined
      } as any

      const result = handleMessage(message, mockSender, sendResponseSpy)

      expect(result).toBe(false)
      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Unknown message type'
      })
    })
  })

  describe('Error Recovery', () => {
    it('should catch and format errors in async handlers', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { fetchSuggestion } = await import('./api-client')
      const { formatErrorForUser } = await import('@/lib/error-handler')
      const { getPreferences } = await import('@/lib/storage')

      const testError = new Error('Test error')
      vi.mocked(getPreferences).mockResolvedValue(null)
      vi.mocked(fetchSuggestion).mockRejectedValue(testError)
      vi.mocked(formatErrorForUser).mockReturnValue('Formatted: Test error')

      const message: RuntimeMessage = {
        type: 'GET_SUGGESTION',
        payload: {
          platform: 'zendesk',
          conversation_context: []
        }
      }

      handleMessage(message, mockSender, sendResponseSpy)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(formatErrorForUser).toHaveBeenCalledWith(testError)
      expect(sendResponseSpy).toHaveBeenCalledWith({
        error: 'Formatted: Test error'
      })
      consoleSpy.mockRestore()
    })
  })

  describe('Concurrent Message Handling', () => {
    it('should handle multiple messages concurrently', async () => {
      const { getMode } = await import('@/lib/storage')

      vi.mocked(getMode).mockResolvedValue('suggestion')

      const message1: RuntimeMessage = { type: 'GET_MODE', payload: undefined }
      const message2: RuntimeMessage = { type: 'GET_MODE', payload: undefined }
      const message3: RuntimeMessage = { type: 'GET_MODE', payload: undefined }

      const spy1 = vi.fn()
      const spy2 = vi.fn()
      const spy3 = vi.fn()

      handleMessage(message1, mockSender, spy1)
      handleMessage(message2, mockSender, spy2)
      handleMessage(message3, mockSender, spy3)

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(spy1).toHaveBeenCalledWith({ mode: 'suggestion' })
      expect(spy2).toHaveBeenCalledWith({ mode: 'suggestion' })
      expect(spy3).toHaveBeenCalledWith({ mode: 'suggestion' })
    })
  })
})
