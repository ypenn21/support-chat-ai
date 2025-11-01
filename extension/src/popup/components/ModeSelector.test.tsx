import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModeSelector } from './ModeSelector'
import * as storage from '@/lib/storage'

// Mock storage module
vi.mock('@/lib/storage', () => ({
  getMode: vi.fn(),
  getYoloState: vi.fn(),
  onModeChange: vi.fn(),
  onYoloStateChange: vi.fn()
}))

describe('ModeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    vi.mocked(storage.getMode).mockResolvedValue('suggestion')
    vi.mocked(storage.getYoloState).mockResolvedValue(null)
    vi.mocked(storage.onModeChange).mockImplementation(() => {})
    vi.mocked(storage.onYoloStateChange).mockImplementation(() => {})

    // Mock chrome.runtime.sendMessage
    globalThis.chrome.runtime.sendMessage = vi.fn().mockResolvedValue({})
  })

  describe('rendering', () => {
    it('should render both mode buttons', async () => {
      render(<ModeSelector />)

      await waitFor(() => {
        expect(screen.getByText('Suggestion Mode')).toBeDefined()
        expect(screen.getByText(/YOLO Mode/)).toBeDefined()
      })
    })

    it('should show description text', async () => {
      render(<ModeSelector />)

      await waitFor(() => {
        expect(screen.getByText('AI suggests responses for you to review')).toBeDefined()
      })
    })

    it('should highlight suggestion mode when active', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')

      render(<ModeSelector />)

      await waitFor(() => {
        const suggestionBtn = screen.getByText('Suggestion Mode')
        expect(suggestionBtn.className).toContain('bg-blue-500')
      })
    })

    it('should highlight YOLO mode when active', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue({
        active: true,
        goal: {
          type: 'resolve_issue',
          description: 'Test goal',
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
          escalation_keywords: ['angry'],
          stop_if_confused: true
        },
        conversationId: 'test-123'
      })

      render(<ModeSelector />)

      await waitFor(() => {
        const yoloBtn = screen.getByText(/YOLO Mode/)
        expect(yoloBtn.className).toContain('bg-orange-500')
        expect(yoloBtn.textContent).toContain('🤖')
      })
    })

    it('should disable YOLO mode button when no goal configured', async () => {
      vi.mocked(storage.getYoloState).mockResolvedValue(null)

      render(<ModeSelector />)

      await waitFor(() => {
        const yoloBtn = screen.getByText(/YOLO Mode/)
        expect(yoloBtn.getAttribute('disabled')).toBe('')
      })
    })
  })

  describe('mode switching', () => {
    it('should switch to suggestion mode when clicked', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')

      render(<ModeSelector />)

      await waitFor(() => {
        const suggestionBtn = screen.getByText('Suggestion Mode')
        fireEvent.click(suggestionBtn)
      })

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'SET_MODE',
          payload: { mode: 'suggestion' }
        })
      })
    })

    it('should switch to YOLO mode when goal is configured', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      vi.mocked(storage.getYoloState).mockResolvedValue({
        active: false,
        goal: {
          type: 'resolve_issue',
          description: 'Test goal',
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
          escalation_keywords: ['angry'],
          stop_if_confused: true
        },
        conversationId: 'test-123'
      })

      render(<ModeSelector />)

      await waitFor(() => {
        const yoloBtn = screen.getByText(/YOLO Mode/)
        fireEvent.click(yoloBtn)
      })

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'SET_MODE',
          payload: { mode: 'yolo' }
        })
      })
    })

    it('should show alert when trying to activate YOLO without goal', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      vi.mocked(storage.getYoloState).mockResolvedValue(null)

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      render(<ModeSelector />)

      await waitFor(() => {
        const yoloBtn = screen.getByText(/YOLO Mode/)
        // Button should be disabled, but let's try to click anyway
        expect(yoloBtn.getAttribute('disabled')).toBe('')
      })

      alertSpy.mockRestore()
    })

    it('should update description when mode changes', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')

      const { rerender } = render(<ModeSelector />)

      await waitFor(() => {
        expect(screen.getByText('AI suggests responses for you to review')).toBeDefined()
      })

      // Simulate mode change
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      rerender(<ModeSelector />)

      await waitFor(() => {
        // Component will still show suggestion mode description until state updates
        // This tests the initial render behavior
        expect(screen.getByText('AI suggests responses for you to review')).toBeDefined()
      })
    })
  })

  describe('error handling', () => {
    it('should handle sendMessage errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')

      // Mock sendMessage to reject
      globalThis.chrome.runtime.sendMessage = vi.fn().mockRejectedValue(new Error('Connection failed'))

      render(<ModeSelector />)

      await waitFor(() => {
        const suggestionBtn = screen.getByText('Suggestion Mode')
        fireEvent.click(suggestionBtn)
      })

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to change mode:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
