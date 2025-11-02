import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EmergencyStop } from './EmergencyStop'
import * as storage from '@/lib/storage'

// Mock storage module
vi.mock('@/lib/storage', () => ({
  getMode: vi.fn(),
  onModeChange: vi.fn()
}))

describe('EmergencyStop', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    vi.mocked(storage.getMode).mockResolvedValue('suggestion')
    vi.mocked(storage.onModeChange).mockImplementation(() => () => {})

    // Mock chrome.runtime.sendMessage
    globalThis.chrome.runtime.sendMessage = vi.fn().mockResolvedValue({})

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  describe('visibility', () => {
    it('should not render when mode is suggestion', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')

      const { container } = render(<EmergencyStop />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    it('should render when mode is yolo', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')

      render(<EmergencyStop />)

      await waitFor(() => {
        expect(screen.getByText('🛑 EMERGENCY STOP')).toBeDefined()
      })
    })
  })

  describe('rendering in YOLO mode', () => {
    beforeEach(() => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
    })

    it('should render stop button', async () => {
      render(<EmergencyStop />)

      await waitFor(() => {
        const button = screen.getByText('🛑 EMERGENCY STOP')
        expect(button).toBeDefined()
        expect(button.className).toContain('bg-red-500')
        expect(button.className).toContain('font-bold')
      })
    })

    it('should render description text', async () => {
      render(<EmergencyStop />)

      await waitFor(() => {
        expect(screen.getByText('Immediately halt autonomous mode and return to manual control')).toBeDefined()
      })
    })

    it('should have red border styling', async () => {
      render(<EmergencyStop />)

      await waitFor(() => {
        const container = screen.getByText('🛑 EMERGENCY STOP').parentElement
        expect(container?.className).toContain('border-red-500')
        expect(container?.className).toContain('bg-red-50')
      })
    })
  })

  describe('emergency stop functionality', () => {
    beforeEach(() => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
    })

    it('should show confirmation dialog when clicked', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<EmergencyStop />)

      await waitFor(() => {
        expect(screen.getByText('🛑 EMERGENCY STOP')).toBeDefined()
      })

      const button = screen.getByText('🛑 EMERGENCY STOP')
      fireEvent.click(button)

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith(
          'Are you sure you want to stop YOLO mode and take manual control?'
        )
      })
    })

    it('should send EMERGENCY_STOP message when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<EmergencyStop />)

      await waitFor(() => {
        expect(screen.getByText('🛑 EMERGENCY STOP')).toBeDefined()
      })

      const button = screen.getByText('🛑 EMERGENCY STOP')
      fireEvent.click(button)

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'EMERGENCY_STOP'
        })
      })
    })

    it('should not send message when confirmation is cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<EmergencyStop />)

      await waitFor(() => {
        const button = screen.getByText('🛑 EMERGENCY STOP')
        fireEvent.click(button)
      })

      // Wait a bit to ensure no message is sent
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled()
    })

    it('should update local state to suggestion mode after confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      const { rerender } = render(<EmergencyStop />)

      await waitFor(() => {
        expect(screen.getByText('🛑 EMERGENCY STOP')).toBeDefined()
      })

      const button = screen.getByText('🛑 EMERGENCY STOP')
      fireEvent.click(button)

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalled()
      })

      // Simulate mode change
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      rerender(<EmergencyStop />)

      await waitFor(() => {
        // Component should no longer be visible
        expect(screen.queryByText('🛑 EMERGENCY STOP')).toBeNull()
      })
    })
  })

  describe('mode changes', () => {
    it('should register mode change listener', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')

      render(<EmergencyStop />)

      await waitFor(() => {
        expect(storage.onModeChange).toHaveBeenCalled()
      })
    })

    it('should hide when mode changes to suggestion', async () => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')

      // Capture the onModeChange callback
      let modeChangeCallback: ((mode: 'suggestion' | 'yolo') => void) | undefined
      vi.mocked(storage.onModeChange).mockImplementation((callback) => {
        modeChangeCallback = callback
        return () => {}
      })

      render(<EmergencyStop />)

      await waitFor(() => {
        expect(screen.getByText('🛑 EMERGENCY STOP')).toBeDefined()
      })

      // Simulate mode change by calling the registered callback
      vi.mocked(storage.getMode).mockResolvedValue('suggestion')
      if (modeChangeCallback) {
        modeChangeCallback('suggestion')
      }

      await waitFor(() => {
        expect(screen.queryByText('🛑 EMERGENCY STOP')).toBeNull()
      })
    })
  })

  describe('button styling', () => {
    beforeEach(() => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
    })

    it('should have hover effect class', async () => {
      render(<EmergencyStop />)

      await waitFor(() => {
        const button = screen.getByText('🛑 EMERGENCY STOP')
        expect(button.className).toContain('hover:bg-red-600')
      })
    })

    it('should be full width', async () => {
      render(<EmergencyStop />)

      await waitFor(() => {
        const button = screen.getByText('🛑 EMERGENCY STOP')
        expect(button.className).toContain('w-full')
      })
    })

    it('should have large text', async () => {
      render(<EmergencyStop />)

      await waitFor(() => {
        const button = screen.getByText('🛑 EMERGENCY STOP')
        expect(button.className).toContain('text-lg')
      })
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(storage.getMode).mockResolvedValue('yolo')
    })

    it('should handle sendMessage errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      // Mock sendMessage to reject
      globalThis.chrome.runtime.sendMessage = vi.fn().mockRejectedValue(new Error('Connection failed'))

      render(<EmergencyStop />)

      await waitFor(() => {
        expect(screen.getByText('🛑 EMERGENCY STOP')).toBeDefined()
      })

      const button = screen.getByText('🛑 EMERGENCY STOP')
      fireEvent.click(button)

      // Should not throw or break the component
      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
