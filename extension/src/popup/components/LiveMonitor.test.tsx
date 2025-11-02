import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LiveMonitor } from './LiveMonitor'
import * as storage from '@/lib/storage'
import type { YoloState, Message } from '@/types'

// Mock storage module
vi.mock('@/lib/storage', () => ({
  getMode: vi.fn(),
  getYoloState: vi.fn(),
  onModeChange: vi.fn(),
  onYoloStateChange: vi.fn()
}))

describe('LiveMonitor', () => {
  const mockYoloState: YoloState = {
    active: true,
    goal: {
      type: 'resolve_issue',
      description: 'Resolve customer shipping delay',
      max_turns: 10
    },
    goalState: {
      turns_taken: 3,
      info_gathered: ['order_number', 'tracking_id'],
      current_step: 'gathering_info',
      started_at: Date.now(),
      last_updated: Date.now()
    },
    safetyConstraints: {
      max_turns: 10,
      escalation_keywords: ['angry', 'manager'],
      stop_if_confused: true
    },
    conversationId: 'test-conv-123'
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    vi.mocked(storage.getMode).mockResolvedValue('suggestion')
    vi.mocked(storage.getYoloState).mockResolvedValue(null)
    vi.mocked(storage.onModeChange).mockImplementation(() => () => {})
    vi.mocked(storage.onYoloStateChange).mockImplementation(() => () => {})

    // Mock chrome.runtime
    globalThis.chrome.runtime.sendMessage = vi.fn().mockResolvedValue({})
    globalThis.chrome.runtime.onMessage = {
      addListener: vi.fn()
    } as any
  })

  describe('visibility', () => {
    it('should not render when mode is suggestion', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      vi.mocked(storage.getYoloState).mockResolvedValue(null)

      const { container } = render(<LiveMonitor />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    it('should not render when yoloState is null', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue(null)

      const { container } = render(<LiveMonitor />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    it('should render when mode is yolo and state exists', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue(mockYoloState)

      render(<LiveMonitor />)

      await waitFor(() => {
        expect(screen.getByText('🤖 YOLO Mode Active')).toBeDefined()
      })
    })
  })

  describe('goal display', () => {
    beforeEach(() => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue(mockYoloState)
    })

    it('should display goal description', async () => {
      render(<LiveMonitor />)

      await waitFor(() => {
        expect(screen.getByText('Resolve customer shipping delay')).toBeDefined()
      })
    })

    it('should display progress bar with correct percentage', async () => {
      render(<LiveMonitor />)

      await waitFor(() => {
        const progressText = screen.getByText('3 / 10 turns')
        expect(progressText).toBeDefined()

        // Progress should be 30% (3/10 * 100)
        const progressBar = screen.getByText('3 / 10 turns').previousElementSibling?.querySelector('div')
        expect(progressBar?.style.width).toBe('30%')
      })
    })

    it('should display info gathered badges', async () => {
      render(<LiveMonitor />)

      await waitFor(() => {
        expect(screen.getByText('✓ order_number')).toBeDefined()
        expect(screen.getByText('✓ tracking_id')).toBeDefined()
      })
    })

    it('should handle empty info_gathered array', async () => {
      const stateWithNoInfo: YoloState = {
        ...mockYoloState,
        goalState: {
          ...mockYoloState.goalState,
          info_gathered: []
        }
      }

      vi.mocked(storage.getYoloState).mockResolvedValue(stateWithNoInfo)

      render(<LiveMonitor />)

      await waitFor(() => {
        expect(screen.getByText('Info Gathered')).toBeDefined()
        // Should not have any badges
        expect(screen.queryByText(/✓/)).toBeNull()
      })
    })
  })

  describe('conversation updates', () => {
    beforeEach(() => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue(mockYoloState)
    })

    it('should register message listener', async () => {
      render(<LiveMonitor />)

      await waitFor(() => {
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled()
      })
    })

    it('should display recent messages when received', async () => {
      let messageListener: any

      vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation((listener) => {
        messageListener = listener
      })

      render(<LiveMonitor />)

      await waitFor(() => {
        expect(messageListener).toBeDefined()
      })

      // Simulate conversation update
      const mockMessages: Message[] = [
        {
          role: 'customer',
          content: 'Where is my order?',
          timestamp: Date.now()
        },
        {
          role: 'agent',
          content: 'Let me check that for you.',
          timestamp: Date.now()
        }
      ]

      messageListener({
        type: 'CONVERSATION_UPDATE',
        payload: { messages: mockMessages }
      })

      await waitFor(() => {
        expect(screen.getByText(/👤:/)).toBeDefined()
        expect(screen.getByText(/🤖:/)).toBeDefined()
      })
    })

    it('should display only last 5 messages', async () => {
      let messageListener: any

      vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation((listener) => {
        messageListener = listener
      })

      render(<LiveMonitor />)

      await waitFor(() => {
        expect(messageListener).toBeDefined()
      })

      // Create 10 messages
      const mockMessages: Message[] = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? 'customer' : 'agent',
        content: `Message ${i + 1}`,
        timestamp: Date.now() + i
      }))

      messageListener({
        type: 'CONVERSATION_UPDATE',
        payload: { messages: mockMessages }
      })

      await waitFor(() => {
        // Should only show messages 6-10
        expect(screen.queryByText(/Message 1$/)).toBeNull()
        expect(screen.queryByText(/Message 5$/)).toBeNull()
        expect(screen.getByText(/Message 6$/)).toBeDefined()
        expect(screen.getByText(/Message 10$/)).toBeDefined()
      })
    })

    it('should truncate long messages to 50 characters', async () => {
      let messageListener: any

      vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation((listener) => {
        messageListener = listener
      })

      render(<LiveMonitor />)

      await waitFor(() => {
        expect(messageListener).toBeDefined()
      })

      const longMessage = 'A'.repeat(100)

      messageListener({
        type: 'CONVERSATION_UPDATE',
        payload: {
          messages: [
            {
              role: 'customer',
              content: longMessage,
              timestamp: Date.now()
            }
          ]
        }
      })

      await waitFor(() => {
        const messageElement = screen.getByText(/👤:/).parentElement
        expect(messageElement?.textContent).toContain('...')
        expect(messageElement?.textContent?.length).toBeLessThan(longMessage.length + 10)
      })
    })
  })

  describe('emergency stop button', () => {
    beforeEach(() => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue(mockYoloState)
    })

    it('should render emergency stop button', async () => {
      render(<LiveMonitor />)

      await waitFor(() => {
        expect(screen.getByText('🛑 Emergency Stop')).toBeDefined()
      })
    })

    it('should send EMERGENCY_STOP message when clicked', async () => {
      render(<LiveMonitor />)

      await waitFor(() => {
        expect(screen.getByText('🛑 Emergency Stop')).toBeDefined()
      })

      const stopButton = screen.getByText('🛑 Emergency Stop')
      fireEvent.click(stopButton)

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'EMERGENCY_STOP'
        })
      })
    })
  })

  describe('progress calculations', () => {
    it('should show 0% when no turns taken', async () => {
      const stateWithNoTurns: YoloState = {
        ...mockYoloState,
        goalState: {
          ...mockYoloState.goalState,
          turns_taken: 0
        }
      }

      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue(stateWithNoTurns)

      render(<LiveMonitor />)

      await waitFor(() => {
        expect(screen.getByText('0 / 10 turns')).toBeDefined()
      })
    })

    it('should show 100% when max turns reached', async () => {
      const stateWithMaxTurns: YoloState = {
        ...mockYoloState,
        goalState: {
          ...mockYoloState.goalState,
          turns_taken: 10
        }
      }

      vi.mocked(storage.getMode).mockResolvedValue('yolo')
      vi.mocked(storage.getYoloState).mockResolvedValue(stateWithMaxTurns)

      render(<LiveMonitor />)

      await waitFor(() => {
        expect(screen.getByText('10 / 10 turns')).toBeDefined()

        const progressBar = screen.getByText('10 / 10 turns').previousElementSibling?.querySelector('div')
        expect(progressBar?.style.width).toBe('100%')
      })
    })
  })
})
