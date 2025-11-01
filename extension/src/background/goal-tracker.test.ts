import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoalTracker } from './goal-tracker'
import type { Goal, SafetyConstraints } from '@/types'
import * as storage from '@/lib/storage'

// Mock the storage module
vi.mock('@/lib/storage', () => ({
  getYoloState: vi.fn(),
  saveYoloState: vi.fn(),
  clearYoloState: vi.fn()
}))

describe('GoalTracker', () => {
  let tracker: GoalTracker

  beforeEach(() => {
    tracker = new GoalTracker()
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should load existing goal state from storage', async () => {
      const existingState = {
        active: true,
        goal: {
          type: 'resolve_issue' as const,
          description: 'Resolve shipping delay',
          required_info: ['order_number', 'tracking_status'],
          max_turns: 10
        },
        goalState: {
          turns_taken: 3,
          info_gathered: ['order_number'],
          current_step: 'gathering_info',
          started_at: Date.now() - 60000,
          last_updated: Date.now()
        },
        safetyConstraints: {
          max_turns: 10,
          escalation_keywords: ['angry', 'manager'],
          stop_if_confused: true,
          min_confidence: 0.7
        },
        conversationId: 'conv-123'
      }

      vi.mocked(storage.getYoloState).mockResolvedValue(existingState)

      await tracker.initialize()

      expect(storage.getYoloState).toHaveBeenCalled()
      expect(tracker.hasActiveGoal()).toBe(true)
      expect(tracker.getState().goal?.description).toBe('Resolve shipping delay')
      expect(tracker.getState().state?.turns_taken).toBe(3)
    })

    it('should handle no existing state gracefully', async () => {
      vi.mocked(storage.getYoloState).mockResolvedValue(null)

      await tracker.initialize()

      expect(tracker.hasActiveGoal()).toBe(false)
      expect(tracker.getState().goal).toBeNull()
    })
  })

  describe('setGoal', () => {
    it('should initialize a new goal with default constraints', async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'Get refund for damaged product',
        required_info: ['order_number', 'issue_description'],
        max_turns: 8
      }

      await tracker.setGoal(goal)

      expect(storage.saveYoloState).toHaveBeenCalled()
      expect(tracker.hasActiveGoal()).toBe(true)

      const state = tracker.getState()
      expect(state.goal).toEqual(goal)
      expect(state.state?.turns_taken).toBe(0)
      expect(state.state?.info_gathered).toEqual([])
      expect(state.state?.current_step).toBe('initializing')
      expect(state.constraints?.max_turns).toBe(8)
      expect(state.constraints?.escalation_keywords).toContain('angry')
      expect(state.conversationId).toMatch(/^conv-/)
    })

    it('should initialize goal with custom constraints', async () => {
      const goal: Goal = {
        type: 'gather_info',
        description: 'Collect account details',
        max_turns: 5
      }

      const constraints: SafetyConstraints = {
        max_turns: 5,
        escalation_keywords: ['frustrated', 'cancel'],
        stop_if_confused: false,
        min_confidence: 0.8
      }

      await tracker.setGoal(goal, constraints)

      const state = tracker.getState()
      expect(state.constraints).toEqual(constraints)
      expect(state.constraints?.min_confidence).toBe(0.8)
      expect(state.constraints?.stop_if_confused).toBe(false)
    })

    it('should generate unique conversation ID', async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'Test goal',
        max_turns: 10
      }

      await tracker.setGoal(goal)
      const firstId = tracker.getState().conversationId

      // Create new tracker and set goal again
      const tracker2 = new GoalTracker()
      await tracker2.setGoal(goal)
      const secondId = tracker2.getState().conversationId

      expect(firstId).not.toBe(secondId)
      expect(firstId).toMatch(/^conv-\d+-[a-z0-9]+$/)
      expect(secondId).toMatch(/^conv-\d+-[a-z0-9]+$/)
    })
  })

  describe('updateState', () => {
    beforeEach(async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'Test',
        max_turns: 10
      }
      await tracker.setGoal(goal)
      vi.clearAllMocks() // Clear the saveState call from setGoal
    })

    it('should update goal state and save to storage', async () => {
      await tracker.updateState({
        current_step: 'responding',
        info_gathered: ['order_number']
      })

      expect(storage.saveYoloState).toHaveBeenCalled()

      const state = tracker.getState().state
      expect(state?.current_step).toBe('responding')
      expect(state?.info_gathered).toEqual(['order_number'])
      expect(state?.turns_taken).toBe(0) // Should preserve existing values
    })

    it('should update last_updated timestamp', async () => {
      const beforeUpdate = Date.now()
      await tracker.updateState({ current_step: 'waiting' })
      const afterUpdate = Date.now()

      const state = tracker.getState().state
      expect(state?.last_updated).toBeGreaterThanOrEqual(beforeUpdate)
      expect(state?.last_updated).toBeLessThanOrEqual(afterUpdate)
    })

    it('should do nothing if no current state exists', async () => {
      const emptyTracker = new GoalTracker()
      await emptyTracker.updateState({ current_step: 'test' })

      expect(storage.saveYoloState).not.toHaveBeenCalled()
    })
  })

  describe('incrementTurn', () => {
    beforeEach(async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'Test',
        max_turns: 10
      }
      await tracker.setGoal(goal)
      vi.clearAllMocks()
    })

    it('should increment turns_taken', async () => {
      expect(tracker.getState().state?.turns_taken).toBe(0)

      await tracker.incrementTurn()
      expect(tracker.getState().state?.turns_taken).toBe(1)

      await tracker.incrementTurn()
      expect(tracker.getState().state?.turns_taken).toBe(2)
    })

    it('should save state after incrementing', async () => {
      await tracker.incrementTurn()
      expect(storage.saveYoloState).toHaveBeenCalled()
    })
  })

  describe('addInfoGathered', () => {
    beforeEach(async () => {
      const goal: Goal = {
        type: 'gather_info',
        description: 'Collect shipping info',
        required_info: ['order_number', 'shipping_address', 'tracking_number'],
        max_turns: 10
      }
      await tracker.setGoal(goal)
      vi.clearAllMocks()
    })

    it('should add new info to info_gathered array', async () => {
      await tracker.addInfoGathered('order_number')
      expect(tracker.getState().state?.info_gathered).toEqual(['order_number'])

      await tracker.addInfoGathered('shipping_address')
      expect(tracker.getState().state?.info_gathered).toEqual(['order_number', 'shipping_address'])
    })

    it('should not add duplicate info', async () => {
      await tracker.addInfoGathered('order_number')
      await tracker.addInfoGathered('order_number')
      await tracker.addInfoGathered('order_number')

      expect(tracker.getState().state?.info_gathered).toEqual(['order_number'])
    })

    it('should save state after adding info', async () => {
      await tracker.addInfoGathered('tracking_number')
      expect(storage.saveYoloState).toHaveBeenCalled()
    })
  })

  describe('isGoalComplete', () => {
    it('should return true when all required info is gathered', async () => {
      const goal: Goal = {
        type: 'gather_info',
        description: 'Collect order info',
        required_info: ['order_number', 'email'],
        max_turns: 10
      }
      await tracker.setGoal(goal)

      expect(tracker.isGoalComplete()).toBe(false)

      await tracker.addInfoGathered('order_number')
      expect(tracker.isGoalComplete()).toBe(false)

      await tracker.addInfoGathered('email')
      expect(tracker.isGoalComplete()).toBe(true)
    })

    it('should return false when no required_info specified', async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'General support',
        max_turns: 10
      }
      await tracker.setGoal(goal)

      expect(tracker.isGoalComplete()).toBe(false)
    })

    it('should return false when no active goal', () => {
      expect(tracker.isGoalComplete()).toBe(false)
    })
  })

  describe('hasReachedMaxTurns', () => {
    it('should return true when max turns reached', async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'Test',
        max_turns: 3
      }
      await tracker.setGoal(goal)

      expect(tracker.hasReachedMaxTurns()).toBe(false)

      await tracker.incrementTurn()
      await tracker.incrementTurn()
      expect(tracker.hasReachedMaxTurns()).toBe(false)

      await tracker.incrementTurn()
      expect(tracker.hasReachedMaxTurns()).toBe(true)
    })

    it('should return false when no active goal', () => {
      expect(tracker.hasReachedMaxTurns()).toBe(false)
    })
  })

  describe('getProgress', () => {
    it('should calculate progress based on info gathered', async () => {
      const goal: Goal = {
        type: 'gather_info',
        description: 'Collect info',
        required_info: ['item1', 'item2', 'item3', 'item4'],
        max_turns: 10
      }
      await tracker.setGoal(goal)

      expect(tracker.getProgress()).toBe(0)

      await tracker.addInfoGathered('item1')
      expect(tracker.getProgress()).toBe(25)

      await tracker.addInfoGathered('item2')
      expect(tracker.getProgress()).toBe(50)

      await tracker.addInfoGathered('item3')
      expect(tracker.getProgress()).toBe(75)

      await tracker.addInfoGathered('item4')
      expect(tracker.getProgress()).toBe(100)
    })

    it('should calculate progress based on turns when no required_info', async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'General support',
        max_turns: 10
      }
      await tracker.setGoal(goal)

      expect(tracker.getProgress()).toBe(0)

      await tracker.incrementTurn()
      await tracker.incrementTurn()
      expect(tracker.getProgress()).toBe(20)

      await tracker.incrementTurn()
      await tracker.incrementTurn()
      await tracker.incrementTurn()
      expect(tracker.getProgress()).toBe(50)

      // Progress caps at 100%
      for (let i = 0; i < 10; i++) {
        await tracker.incrementTurn()
      }
      expect(tracker.getProgress()).toBe(100)
    })

    it('should return 0 when no active goal', () => {
      expect(tracker.getProgress()).toBe(0)
    })
  })

  describe('getProgressSummary', () => {
    it('should return summary with info gathered', async () => {
      const goal: Goal = {
        type: 'gather_info',
        description: 'Collect data',
        required_info: ['a', 'b', 'c'],
        max_turns: 10
      }
      await tracker.setGoal(goal)
      await tracker.addInfoGathered('a')
      await tracker.incrementTurn()

      const summary = tracker.getProgressSummary()
      expect(summary).toContain('33%') // 1/3 info gathered
      expect(summary).toContain('1/10 turns')
      expect(summary).toContain('1/3 info gathered')
    })

    it('should return summary without info when not tracking info', async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'General',
        max_turns: 5
      }
      await tracker.setGoal(goal)
      await tracker.incrementTurn()
      await tracker.incrementTurn()

      const summary = tracker.getProgressSummary()
      expect(summary).toContain('40%') // 2/5 turns
      expect(summary).toContain('2/5 turns')
      expect(summary).not.toContain('info gathered')
    })

    it('should return "No active goal" when no goal set', () => {
      expect(tracker.getProgressSummary()).toBe('No active goal')
    })
  })

  describe('getRequiredInfo and getMissingInfo', () => {
    it('should return required info and missing info', async () => {
      const goal: Goal = {
        type: 'gather_info',
        description: 'Collect shipping details',
        required_info: ['order_number', 'address', 'phone'],
        max_turns: 10
      }
      await tracker.setGoal(goal)

      expect(tracker.getRequiredInfo()).toEqual(['order_number', 'address', 'phone'])
      expect(tracker.getMissingInfo()).toEqual(['order_number', 'address', 'phone'])

      await tracker.addInfoGathered('order_number')
      expect(tracker.getMissingInfo()).toEqual(['address', 'phone'])

      await tracker.addInfoGathered('phone')
      expect(tracker.getMissingInfo()).toEqual(['address'])

      await tracker.addInfoGathered('address')
      expect(tracker.getMissingInfo()).toEqual([])
    })

    it('should return empty arrays when no required_info', async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'General',
        max_turns: 10
      }
      await tracker.setGoal(goal)

      expect(tracker.getRequiredInfo()).toEqual([])
      expect(tracker.getMissingInfo()).toEqual([])
    })
  })

  describe('clear', () => {
    it('should clear all state and storage', async () => {
      const goal: Goal = {
        type: 'resolve_issue',
        description: 'Test',
        max_turns: 10
      }
      await tracker.setGoal(goal)
      await tracker.incrementTurn()
      await tracker.addInfoGathered('test_info')

      expect(tracker.hasActiveGoal()).toBe(true)

      await tracker.clear()

      expect(tracker.hasActiveGoal()).toBe(false)
      expect(tracker.getState().goal).toBeNull()
      expect(tracker.getState().state).toBeNull()
      expect(tracker.getState().constraints).toBeNull()
      expect(tracker.getState().conversationId).toBeNull()
      expect(storage.clearYoloState).toHaveBeenCalled()
    })
  })

  describe('getState', () => {
    it('should return complete state snapshot', async () => {
      const goal: Goal = {
        type: 'gather_info',
        description: 'Test goal',
        required_info: ['info1'],
        max_turns: 5
      }
      const constraints: SafetyConstraints = {
        max_turns: 5,
        escalation_keywords: ['test'],
        stop_if_confused: true,
        min_confidence: 0.8
      }

      await tracker.setGoal(goal, constraints)
      await tracker.addInfoGathered('info1')
      await tracker.incrementTurn()

      const state = tracker.getState()

      expect(state.goal).toEqual(goal)
      expect(state.state?.turns_taken).toBe(1)
      expect(state.state?.info_gathered).toEqual(['info1'])
      expect(state.constraints).toEqual(constraints)
      expect(state.conversationId).toBeTruthy()
    })
  })
})
