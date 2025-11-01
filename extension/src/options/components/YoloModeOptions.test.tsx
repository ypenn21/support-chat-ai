import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { YoloModeOptions } from './YoloModeOptions'

describe('YoloModeOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock chrome.runtime.sendMessage
    globalThis.chrome.runtime.sendMessage = vi.fn().mockResolvedValue({})

    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  describe('rendering', () => {
    it('should render the component title', () => {
      render(<YoloModeOptions />)

      expect(screen.getByText('YOLO Mode Configuration')).toBeDefined()
    })

    it('should render goal presets section', () => {
      render(<YoloModeOptions />)

      expect(screen.getByText('Goal Presets')).toBeDefined()
    })

    it('should render safety rules section', () => {
      render(<YoloModeOptions />)

      expect(screen.getByText('Safety Rules')).toBeDefined()
    })

    it('should render all three goal presets', () => {
      render(<YoloModeOptions />)

      expect(screen.getByText('Resolve customer shipping delay')).toBeDefined()
      expect(screen.getByText('Gather customer information for support ticket')).toBeDefined()
      expect(screen.getByText('Gather info and escalate to specialist')).toBeDefined()
    })

    it('should display max turns for each preset', () => {
      render(<YoloModeOptions />)

      const maxTurnsElements = screen.getAllByText(/Max turns:/)
      expect(maxTurnsElements.length).toBe(3)
    })

    it('should display required info for presets that have it', () => {
      render(<YoloModeOptions />)

      expect(screen.getByText(/Required: order_number, tracking_id, expected_delivery/)).toBeDefined()
      expect(screen.getByText(/Required: name, email, issue_description/)).toBeDefined()
      expect(screen.getByText(/Required: issue_category, urgency, account_id/)).toBeDefined()
    })
  })

  describe('goal presets', () => {
    it('should render load button for each preset', () => {
      render(<YoloModeOptions />)

      const loadButtons = screen.getAllByText('Load Preset')
      expect(loadButtons.length).toBe(3)
    })

    it('should send SET_GOAL message when loading resolve_issue preset', async () => {
      render(<YoloModeOptions />)

      const resolveIssueCard = screen.getByText('Resolve customer shipping delay').closest('div')
      const loadButton = within(resolveIssueCard as HTMLElement).getByText('Load Preset')

      fireEvent.click(loadButton)

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'SET_GOAL',
          payload: {
            goal: {
              type: 'resolve_issue',
              description: 'Resolve customer shipping delay',
              required_info: ['order_number', 'tracking_id', 'expected_delivery'],
              max_turns: 10
            },
            constraints: {
              max_turns: 10,
              escalation_keywords: ['angry', 'manager', 'complaint'],
              stop_if_confused: true
            }
          }
        })
      })
    })

    it('should send SET_GOAL message when loading gather_info preset', async () => {
      render(<YoloModeOptions />)

      const gatherInfoCard = screen.getByText('Gather customer information for support ticket').closest('div')
      const loadButton = within(gatherInfoCard as HTMLElement).getByText('Load Preset')

      fireEvent.click(loadButton)

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'SET_GOAL',
          payload: {
            goal: {
              type: 'gather_info',
              description: 'Gather customer information for support ticket',
              required_info: ['name', 'email', 'issue_description'],
              max_turns: 5
            },
            constraints: {
              max_turns: 5,
              escalation_keywords: ['angry', 'manager', 'complaint'],
              stop_if_confused: true
            }
          }
        })
      })
    })

    it('should send SET_GOAL message when loading escalate preset', async () => {
      render(<YoloModeOptions />)

      const escalateCard = screen.getByText('Gather info and escalate to specialist').closest('div')
      const loadButton = within(escalateCard as HTMLElement).getByText('Load Preset')

      fireEvent.click(loadButton)

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'SET_GOAL',
          payload: {
            goal: {
              type: 'escalate',
              description: 'Gather info and escalate to specialist',
              required_info: ['issue_category', 'urgency', 'account_id'],
              max_turns: 3
            },
            constraints: {
              max_turns: 3,
              escalation_keywords: ['angry', 'manager', 'complaint'],
              stop_if_confused: true
            }
          }
        })
      })
    })

    it('should show success alert after loading preset', async () => {
      const alertSpy = vi.spyOn(window, 'alert')

      render(<YoloModeOptions />)

      const loadButtons = screen.getAllByText('Load Preset')
      fireEvent.click(loadButtons[0])

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Goal preset loaded!')
      })

      alertSpy.mockRestore()
    })

    it('should use same escalation keywords for all presets', async () => {
      render(<YoloModeOptions />)

      const loadButtons = screen.getAllByText('Load Preset')

      for (const button of loadButtons) {
        vi.clearAllMocks()
        fireEvent.click(button)

        await waitFor(() => {
          expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              payload: expect.objectContaining({
                constraints: expect.objectContaining({
                  escalation_keywords: ['angry', 'manager', 'complaint']
                })
              })
            })
          )
        })
      }
    })
  })

  describe('safety rules configuration', () => {
    it('should render default max turns input', () => {
      render(<YoloModeOptions />)

      const input = screen.getByLabelText('Default Max Turns') as HTMLInputElement
      expect(input).toBeDefined()
      expect(input.defaultValue).toBe('10')
      expect(input.type).toBe('number')
    })

    it('should render preview delay input', () => {
      render(<YoloModeOptions />)

      const input = screen.getByLabelText('Preview Delay (seconds)') as HTMLInputElement
      expect(input).toBeDefined()
      expect(input.defaultValue).toBe('3')
      expect(input.type).toBe('number')
    })

    it('should render minimum confidence threshold input', () => {
      render(<YoloModeOptions />)

      const input = screen.getByLabelText('Minimum Confidence Threshold') as HTMLInputElement
      expect(input).toBeDefined()
      expect(input.defaultValue).toBe('0.7')
      expect(input.type).toBe('number')
      expect(input.step).toBe('0.1')
    })
  })

  describe('preset cards layout', () => {
    it('should render presets in a grid', () => {
      render(<YoloModeOptions />)

      const presetContainer = screen.getByText('Goal Presets').nextElementSibling
      expect(presetContainer?.className).toContain('grid')
      expect(presetContainer?.className).toContain('md:grid-cols-2')
    })

    it('should render each preset with border and padding', () => {
      render(<YoloModeOptions />)

      const presetCards = screen.getAllByText('Load Preset')
      presetCards.forEach(button => {
        const card = button.closest('div')
        expect(card?.className).toContain('border')
        expect(card?.className).toContain('rounded')
        expect(card?.className).toContain('p-3')
      })
    })

    it('should display goal descriptions with proper styling', () => {
      render(<YoloModeOptions />)

      const descriptions = [
        'Resolve customer shipping delay',
        'Gather customer information for support ticket',
        'Gather info and escalate to specialist'
      ]

      descriptions.forEach(desc => {
        const element = screen.getByText(desc)
        expect(element.className).toContain('font-medium')
      })
    })

    it('should display max turns with gray text', () => {
      render(<YoloModeOptions />)

      const maxTurnsElements = screen.getAllByText(/Max turns:/)
      maxTurnsElements.forEach(element => {
        expect(element.className).toContain('text-gray-600')
      })
    })

    it('should display required info with smaller text', () => {
      render(<YoloModeOptions />)

      const requiredInfoElements = screen.getAllByText(/Required:/)
      requiredInfoElements.forEach(element => {
        expect(element.className).toContain('text-xs')
        expect(element.className).toContain('text-gray-500')
      })
    })
  })

  describe('load button styling', () => {
    it('should have proper button styling', () => {
      render(<YoloModeOptions />)

      const loadButtons = screen.getAllByText('Load Preset')
      loadButtons.forEach(button => {
        expect(button.className).toContain('bg-blue-500')
        expect(button.className).toContain('text-white')
        expect(button.className).toContain('px-3')
        expect(button.className).toContain('py-1')
        expect(button.className).toContain('rounded')
        expect(button.className).toContain('text-sm')
      })
    })
  })

  describe('error handling', () => {
    it('should handle sendMessage errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock sendMessage to reject
      globalThis.chrome.runtime.sendMessage = vi.fn().mockRejectedValue(new Error('Connection failed'))

      render(<YoloModeOptions />)

      const loadButtons = screen.getAllByText('Load Preset')

      // Catch the unhandled rejection
      const clickPromise = new Promise((resolve) => {
        fireEvent.click(loadButtons[0])
        setTimeout(resolve, 100)
      })

      await clickPromise

      // Should not throw or break the component
      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
