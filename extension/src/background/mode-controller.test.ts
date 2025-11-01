import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModeController } from './mode-controller'
import * as storage from '@/lib/storage'

// Mock the storage module
vi.mock('@/lib/storage', () => ({
  getMode: vi.fn(),
  setMode: vi.fn(),
  getYoloState: vi.fn(),
  clearYoloState: vi.fn()
}))

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  },
  notifications: {
    create: vi.fn()
  }
}

globalThis.chrome = mockChrome as any

describe('ModeController', () => {
  let controller: ModeController

  beforeEach(() => {
    controller = new ModeController()
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should load suggestion mode by default', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')

      await controller.initialize()

      expect(storage.getMode).toHaveBeenCalled()
      expect(controller.getCurrentMode()).toBe('suggestion')
    })

    it('should load YOLO mode if previously set', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')

      await controller.initialize()

      expect(controller.getCurrentMode()).toBe('yolo')
      expect(controller.isYoloMode()).toBe(true)
    })

    it('should default to suggestion mode if no mode stored', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')

      await controller.initialize()

      expect(controller.getCurrentMode()).toBe('suggestion')
      expect(controller.isSuggestionMode()).toBe(true)
    })
  })

  describe('switchMode', () => {
    it('should switch from suggestion to YOLO mode with valid goal', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      vi.mocked(storage.getYoloState).mockResolvedValue({
        active: true,
        goal: {
          type: 'resolve_issue',
          description: 'Resolve shipping issue',
          max_turns: 10
        },
        goalState: {
          turns_taken: 0,
          info_gathered: [],
          current_step: 'initializing',
          started_at: Date.now(),
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: ['angry', 'manager'],
          stop_if_confused: true,
          min_confidence: 0.7
        },
        conversationId: 'conv-123'
      })
      mockChrome.tabs.query.mockResolvedValue([])

      await controller.initialize()
      await controller.switchMode('yolo')

      expect(storage.setMode).toHaveBeenCalledWith('yolo')
      expect(controller.getCurrentMode()).toBe('yolo')
    })

    it('should throw error when switching to YOLO mode without goal', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      vi.mocked(storage.getYoloState).mockResolvedValue(null)

      await controller.initialize()

      await expect(controller.switchMode('yolo')).rejects.toThrow(
        'Cannot activate YOLO mode without a configured goal'
      )
      expect(controller.getCurrentMode()).toBe('suggestion')
    })

    it('should broadcast mode change to all tabs', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      vi.mocked(storage.getYoloState).mockResolvedValue({
        active: true,
        goal: {
          type: 'resolve_issue',
          description: 'Test',
          max_turns: 10
        },
        goalState: {
          turns_taken: 0,
          info_gathered: [],
          current_step: 'initializing',
          started_at: Date.now(),
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: [],
          stop_if_confused: true
        },
        conversationId: 'conv-123'
      })
      mockChrome.tabs.query.mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ])
      mockChrome.tabs.sendMessage.mockResolvedValue({})

      await controller.initialize()
      await controller.switchMode('yolo')

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({})
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledTimes(3)
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: 'MODE_CHANGED',
        payload: { mode: 'yolo' }
      })
    })

    it('should handle tabs without content script gracefully', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      vi.mocked(storage.getYoloState).mockResolvedValue({
        active: true,
        goal: {
          type: 'resolve_issue',
          description: 'Test',
          max_turns: 10
        },
        goalState: {
          turns_taken: 0,
          info_gathered: [],
          current_step: 'initializing',
          started_at: Date.now(),
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: [],
          stop_if_confused: true
        },
        conversationId: 'conv-123'
      })
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }])
      mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Tab not ready'))

      await controller.initialize()

      // Should not throw even if tab message fails
      await expect(controller.switchMode('yolo')).resolves.not.toThrow()
      expect(controller.getCurrentMode()).toBe('yolo')
    })
  })

  describe('emergencyStop', () => {
    it('should switch to suggestion mode and clear YOLO state', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue({
        active: true,
        goal: {
          type: 'resolve_issue',
          description: 'Test',
          max_turns: 10
        },
        goalState: {
          turns_taken: 3,
          info_gathered: [],
          current_step: 'responding',
          started_at: Date.now(),
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: [],
          stop_if_confused: true
        },
        conversationId: 'conv-123'
      })
      mockChrome.tabs.query.mockResolvedValue([])
      mockChrome.notifications.create.mockResolvedValue('notification-id')

      await controller.initialize()
      await controller.emergencyStop()

      expect(storage.clearYoloState).toHaveBeenCalled()
      expect(storage.setMode).toHaveBeenCalledWith('suggestion')
      expect(controller.getCurrentMode()).toBe('suggestion')
      expect(mockChrome.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          title: 'YOLO Mode Stopped',
          message: 'Autonomous mode has been stopped. Returning to manual control.'
        })
      )
    })

    it('should do nothing if not in YOLO mode', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')

      await controller.initialize()
      await controller.emergencyStop()

      expect(storage.clearYoloState).not.toHaveBeenCalled()
      expect(storage.setMode).not.toHaveBeenCalled()
    })

    it('should handle notification errors gracefully', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue({
        active: true,
        goal: {
          type: 'resolve_issue',
          description: 'Test',
          max_turns: 10
        },
        goalState: {
          turns_taken: 0,
          info_gathered: [],
          current_step: 'initializing',
          started_at: Date.now(),
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: [],
          stop_if_confused: true
        },
        conversationId: 'conv-123'
      })
      mockChrome.tabs.query.mockResolvedValue([])
      mockChrome.notifications.create.mockRejectedValue(new Error('Notifications disabled'))

      await controller.initialize()

      // Should not throw even if notification fails
      await expect(controller.emergencyStop()).resolves.not.toThrow()
      expect(controller.getCurrentMode()).toBe('suggestion')
    })
  })

  describe('mode getters', () => {
    it('should correctly report current mode', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      await controller.initialize()

      expect(controller.getCurrentMode()).toBe('suggestion')
      expect(controller.isSuggestionMode()).toBe(true)
      expect(controller.isYoloMode()).toBe(false)
    })

    it('should correctly report YOLO mode', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      await controller.initialize()

      expect(controller.getCurrentMode()).toBe('yolo')
      expect(controller.isYoloMode()).toBe(true)
      expect(controller.isSuggestionMode()).toBe(false)
    })
  })
})
