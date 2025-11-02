import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GoalConfig } from './GoalConfig'

describe('GoalConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock chrome.runtime.sendMessage
    globalThis.chrome.runtime.sendMessage = vi.fn().mockResolvedValue({})

    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  describe('rendering', () => {
    it('should render all form fields', () => {
      render(<GoalConfig />)

      expect(screen.getByText('Goal Configuration')).toBeDefined()
      expect(screen.getByLabelText('Goal Type')).toBeDefined()
      expect(screen.getByLabelText('Description')).toBeDefined()
      expect(screen.getByLabelText('Max Turns')).toBeDefined()
      expect(screen.getByLabelText(/Escalation Keywords/)).toBeDefined()
      expect(screen.getByText('Save Goal')).toBeDefined()
    })

    it('should render goal type options', () => {
      render(<GoalConfig />)

      const select = screen.getByLabelText('Goal Type') as HTMLSelectElement
      const options = Array.from(select.options).map(opt => opt.value)

      expect(options).toContain('resolve_issue')
      expect(options).toContain('gather_info')
      expect(options).toContain('escalate')
      expect(options).toContain('custom')
    })

    it('should have default values', () => {
      render(<GoalConfig />)

      const goalTypeSelect = screen.getByLabelText('Goal Type') as HTMLSelectElement
      const maxTurnsInput = screen.getByLabelText('Max Turns') as HTMLInputElement
      const keywordsInput = screen.getByLabelText(/Escalation Keywords/) as HTMLInputElement

      expect(goalTypeSelect.value).toBe('resolve_issue')
      expect(maxTurnsInput.value).toBe('10')
      expect(keywordsInput.value).toBe('angry,manager,complaint')
    })
  })

  describe('form interactions', () => {
    it('should update goal type when changed', () => {
      render(<GoalConfig />)

      const select = screen.getByLabelText('Goal Type') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'gather_info' } })

      expect(select.value).toBe('gather_info')
    })

    it('should update description when typed', () => {
      render(<GoalConfig />)

      const input = screen.getByLabelText('Description') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Resolve shipping delay' } })

      expect(input.value).toBe('Resolve shipping delay')
    })

    it('should update max turns when changed', () => {
      render(<GoalConfig />)

      const input = screen.getByLabelText('Max Turns') as HTMLInputElement
      fireEvent.change(input, { target: { value: '15' } })

      expect(input.value).toBe('15')
    })

    it('should update escalation keywords when changed', () => {
      render(<GoalConfig />)

      const input = screen.getByLabelText(/Escalation Keywords/) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'angry,frustrated,urgent' } })

      expect(input.value).toBe('angry,frustrated,urgent')
    })
  })

  describe('save functionality', () => {
    it('should send goal configuration message when saved', async () => {
      render(<GoalConfig />)

      // Set form values
      const goalTypeSelect = screen.getByLabelText('Goal Type') as HTMLSelectElement
      const descriptionInput = screen.getByLabelText('Description') as HTMLInputElement
      const maxTurnsInput = screen.getByLabelText('Max Turns') as HTMLInputElement
      const keywordsInput = screen.getByLabelText(/Escalation Keywords/) as HTMLInputElement

      fireEvent.change(goalTypeSelect, { target: { value: 'resolve_issue' } })
      fireEvent.change(descriptionInput, { target: { value: 'Resolve shipping delay' } })
      fireEvent.change(maxTurnsInput, { target: { value: '8' } })
      fireEvent.change(keywordsInput, { target: { value: 'angry,manager' } })

      // Click save
      const saveButton = screen.getByText('Save Goal')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'SET_GOAL',
          payload: {
            goal: {
              type: 'resolve_issue',
              description: 'Resolve shipping delay',
              max_turns: 8
            },
            constraints: {
              max_turns: 8,
              escalation_keywords: ['angry', 'manager'],
              stop_if_confused: true,
              min_confidence: 0.7
            }
          }
        })
      })
    })

    it('should trim whitespace from keywords', async () => {
      render(<GoalConfig />)

      const keywordsInput = screen.getByLabelText(/Escalation Keywords/) as HTMLInputElement
      fireEvent.change(keywordsInput, { target: { value: ' angry , manager , complaint ' } })

      const saveButton = screen.getByText('Save Goal')
      fireEvent.click(saveButton)

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
    })

    it('should show success alert after saving', async () => {
      const alertSpy = vi.spyOn(window, 'alert')

      render(<GoalConfig />)

      const saveButton = screen.getByText('Save Goal')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Goal configured! You can now activate YOLO mode.')
      })

      alertSpy.mockRestore()
    })

    it('should handle all goal types', async () => {
      const goalTypes: Array<'resolve_issue' | 'gather_info' | 'escalate' | 'custom'> = [
        'resolve_issue',
        'gather_info',
        'escalate',
        'custom'
      ]

      for (const goalType of goalTypes) {
        vi.clearAllMocks()

        const { unmount } = render(<GoalConfig />)

        const select = screen.getByLabelText('Goal Type') as HTMLSelectElement
        fireEvent.change(select, { target: { value: goalType } })

        const saveButton = screen.getByText('Save Goal')
        fireEvent.click(saveButton)

        await waitFor(() => {
          expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              payload: expect.objectContaining({
                goal: expect.objectContaining({
                  type: goalType
                })
              })
            })
          )
        })

        // Cleanup to prevent multiple elements in DOM
        unmount()
      }
    })
  })

  describe('input validation', () => {
    it('should respect min and max constraints on max turns', () => {
      render(<GoalConfig />)

      const input = screen.getByLabelText('Max Turns') as HTMLInputElement
      expect(input.min).toBe('1')
      expect(input.max).toBe('20')
    })

    it('should allow empty description', async () => {
      render(<GoalConfig />)

      const descriptionInput = screen.getByLabelText('Description') as HTMLInputElement
      fireEvent.change(descriptionInput, { target: { value: '' } })

      const saveButton = screen.getByText('Save Goal')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              goal: expect.objectContaining({
                description: ''
              })
            })
          })
        )
      })
    })
  })
})
