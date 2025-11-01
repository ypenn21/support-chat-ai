import { describe, it, expect, beforeEach } from 'vitest'
import { SafetyMonitor } from './safety-monitor'
import type { Message, GoalState, SafetyConstraints } from '@/types'

describe('SafetyMonitor', () => {
  let monitor: SafetyMonitor
  let defaultConstraints: SafetyConstraints
  let mockGoalState: GoalState

  beforeEach(() => {
    defaultConstraints = {
      max_turns: 10,
      escalation_keywords: ['angry', 'manager', 'complaint', 'lawyer'],
      stop_if_confused: true,
      min_confidence: 0.7
    }

    mockGoalState = {
      turns_taken: 2,
      info_gathered: ['order_number'],
      current_step: 'responding',
      started_at: Date.now() - 60000,
      last_updated: Date.now()
    }

    monitor = new SafetyMonitor(defaultConstraints)
  })

  describe('constructor', () => {
    it('should initialize with provided constraints', () => {
      const constraints = monitor.getConstraints()
      expect(constraints.max_turns).toBe(10)
      expect(constraints.escalation_keywords).toEqual(['angry', 'manager', 'complaint', 'lawyer'])
      expect(constraints.stop_if_confused).toBe(true)
      expect(constraints.min_confidence).toBe(0.7)
    })

    it('should use default values for missing optional fields', () => {
      const minimalConstraints: SafetyConstraints = {
        max_turns: 5,
        escalation_keywords: [],
        stop_if_confused: true
      }

      const minMonitor = new SafetyMonitor(minimalConstraints)
      const constraints = minMonitor.getConstraints()

      expect(constraints.min_confidence).toBe(0.7)
    })
  })

  describe('checkMessage - escalation keywords', () => {
    it('should escalate on exact keyword match', () => {
      const message: Message = {
        role: 'agent',
        content: 'I am very angry about this situation!',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, mockGoalState)

      expect(result.shouldEscalate).toBe(true)
      expect(result.reason).toContain('Escalation keyword detected')
      expect(result.triggers).toContain('keyword: "angry"')
    })

    it('should escalate on case-insensitive keyword match', () => {
      const message: Message = {
        role: 'agent',
        content: 'I want to speak to your MANAGER immediately!',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, mockGoalState)

      expect(result.shouldEscalate).toBe(true)
      expect(result.triggers).toContain('keyword: "manager"')
    })

    it('should escalate on partial word match', () => {
      const message: Message = {
        role: 'agent',
        content: 'I am filing a complaint about this service.',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, mockGoalState)

      expect(result.shouldEscalate).toBe(true)
      expect(result.triggers).toContain('keyword: "complaint"')
    })

    it('should not escalate when no keywords present', () => {
      const message: Message = {
        role: 'agent',
        content: 'Thank you for your help with my order.',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, mockGoalState)

      expect(result.shouldEscalate).toBe(false)
      expect(result.reason).toBeUndefined()
    })

    it('should detect first keyword when multiple present', () => {
      const message: Message = {
        role: 'agent',
        content: 'I am angry and want to file a complaint with a lawyer!',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, mockGoalState)

      expect(result.shouldEscalate).toBe(true)
      // Should trigger on first keyword found in the keywords array
      expect(result.triggers.length).toBeGreaterThan(0)
    })
  })

  describe('checkMessage - max turns', () => {
    it('should escalate when max turns reached', () => {
      const reachedMaxState: GoalState = {
        ...mockGoalState,
        turns_taken: 10
      }

      const message: Message = {
        role: 'agent',
        content: 'Normal message',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, reachedMaxState)

      expect(result.shouldEscalate).toBe(true)
      expect(result.reason).toContain('Maximum conversation turns reached')
      expect(result.triggers).toContain('max turns reached')
    })

    it('should escalate when max turns exceeded', () => {
      const exceededMaxState: GoalState = {
        ...mockGoalState,
        turns_taken: 15
      }

      const message: Message = {
        role: 'agent',
        content: 'Normal message',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, exceededMaxState)

      expect(result.shouldEscalate).toBe(true)
    })

    it('should not escalate when below max turns', () => {
      const belowMaxState: GoalState = {
        ...mockGoalState,
        turns_taken: 5
      }

      const message: Message = {
        role: 'agent',
        content: 'Normal message',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, belowMaxState)

      expect(result.shouldEscalate).toBe(false)
    })
  })

  describe('checkMessage - no progress detection', () => {
    it('should escalate when no progress after 3 turns', () => {
      const noProgressState: GoalState = {
        ...mockGoalState,
        turns_taken: 4,
        info_gathered: []
      }

      const message: Message = {
        role: 'agent',
        content: 'What was your question again?',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, noProgressState)

      expect(result.shouldEscalate).toBe(true)
      expect(result.reason).toContain('No progress made')
      expect(result.triggers).toContain('no progress')
    })

    it('should not escalate when info is being gathered', () => {
      const progressState: GoalState = {
        ...mockGoalState,
        turns_taken: 5,
        info_gathered: ['order_number', 'email']
      }

      const message: Message = {
        role: 'agent',
        content: 'Here is my information',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, progressState)

      expect(result.shouldEscalate).toBe(false)
    })

    it('should not escalate within first 3 turns even with no progress', () => {
      const earlyState: GoalState = {
        ...mockGoalState,
        turns_taken: 2,
        info_gathered: []
      }

      const message: Message = {
        role: 'agent',
        content: 'Hello',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, earlyState)

      expect(result.shouldEscalate).toBe(false)
    })

    it('should not check for confusion when stop_if_confused is false', () => {
      const noConfusionCheckConstraints: SafetyConstraints = {
        ...defaultConstraints,
        stop_if_confused: false
      }

      const noConfusionMonitor = new SafetyMonitor(noConfusionCheckConstraints)

      const noProgressState: GoalState = {
        ...mockGoalState,
        turns_taken: 5,
        info_gathered: []
      }

      const message: Message = {
        role: 'agent',
        content: 'I am confused',
        timestamp: Date.now()
      }

      const result = noConfusionMonitor.checkMessage(message, noProgressState)

      // Should not escalate due to confusion checking being disabled
      expect(result.shouldEscalate).toBe(false)
    })
  })

  describe('checkConfidence', () => {
    it('should return true when confidence meets threshold', () => {
      expect(monitor.checkConfidence(0.7)).toBe(true)
      expect(monitor.checkConfidence(0.8)).toBe(true)
      expect(monitor.checkConfidence(1.0)).toBe(true)
    })

    it('should return false when confidence below threshold', () => {
      expect(monitor.checkConfidence(0.69)).toBe(false)
      expect(monitor.checkConfidence(0.5)).toBe(false)
      expect(monitor.checkConfidence(0.0)).toBe(false)
    })

    it('should use custom min_confidence threshold', () => {
      const strictConstraints: SafetyConstraints = {
        ...defaultConstraints,
        min_confidence: 0.9
      }

      const strictMonitor = new SafetyMonitor(strictConstraints)

      expect(strictMonitor.checkConfidence(0.85)).toBe(false)
      expect(strictMonitor.checkConfidence(0.9)).toBe(true)
      expect(strictMonitor.checkConfidence(0.95)).toBe(true)
    })
  })

  describe('analyzeSentiment', () => {
    it('should detect negative sentiment', () => {
      const negativeMessages: Message[] = [
        { role: 'agent', content: 'I am very angry about this!', timestamp: Date.now() },
        { role: 'agent', content: 'This is the worst service ever', timestamp: Date.now() },
        { role: 'agent', content: 'I hate how this is being handled', timestamp: Date.now() },
        { role: 'agent', content: 'I am so frustrated with this situation', timestamp: Date.now() },
        { role: 'agent', content: 'This is terrible and unacceptable', timestamp: Date.now() }
      ]

      negativeMessages.forEach(message => {
        expect(monitor.analyzeSentiment(message)).toBe('negative')
      })
    })

    it('should detect positive sentiment', () => {
      const positiveMessages: Message[] = [
        { role: 'agent', content: 'Thank you so much for your help!', timestamp: Date.now() },
        { role: 'agent', content: 'This is great, I appreciate it', timestamp: Date.now() },
        { role: 'agent', content: 'Excellent service, very helpful', timestamp: Date.now() },
        { role: 'agent', content: 'Perfect! That is exactly what I needed', timestamp: Date.now() }
      ]

      positiveMessages.forEach(message => {
        expect(monitor.analyzeSentiment(message)).toBe('positive')
      })
    })

    it('should detect neutral sentiment', () => {
      const neutralMessages: Message[] = [
        { role: 'agent', content: 'What is my order number?', timestamp: Date.now() },
        { role: 'agent', content: 'I placed an order last week', timestamp: Date.now() },
        { role: 'agent', content: 'Can you check the status?', timestamp: Date.now() },
        { role: 'agent', content: 'My email is customer@example.com', timestamp: Date.now() }
      ]

      neutralMessages.forEach(message => {
        expect(monitor.analyzeSentiment(message)).toBe('neutral')
      })
    })

    it('should handle mixed sentiment as neutral', () => {
      const message: Message = {
        role: 'agent',
        content: 'I appreciate your help but I am also frustrated with the delay',
        timestamp: Date.now()
      }

      expect(monitor.analyzeSentiment(message)).toBe('neutral')
    })

    it('should be case-insensitive', () => {
      const message1: Message = {
        role: 'agent',
        content: 'I AM ANGRY!',
        timestamp: Date.now()
      }

      const message2: Message = {
        role: 'agent',
        content: 'THANK YOU!',
        timestamp: Date.now()
      }

      expect(monitor.analyzeSentiment(message1)).toBe('negative')
      expect(monitor.analyzeSentiment(message2)).toBe('positive')
    })
  })

  describe('getSafetyStatus', () => {
    it('should return safe status with no warnings', () => {
      const status = monitor.getSafetyStatus(mockGoalState)

      expect(status.safe).toBe(true)
      expect(status.warnings).toHaveLength(0)
      expect(status.stats.turns_remaining).toBe(8) // 10 - 2
      expect(status.stats.confidence_threshold).toBe(0.7)
      expect(status.stats.escalation_keywords_count).toBe(4)
    })

    it('should warn when few turns remaining', () => {
      const nearMaxState: GoalState = {
        ...mockGoalState,
        turns_taken: 8
      }

      const status = monitor.getSafetyStatus(nearMaxState)

      expect(status.safe).toBe(false)
      expect(status.warnings).toContain('Only 2 turns remaining')
    })

    it('should warn when no progress after multiple turns', () => {
      const noProgressState: GoalState = {
        ...mockGoalState,
        turns_taken: 5,
        info_gathered: []
      }

      const status = monitor.getSafetyStatus(noProgressState)

      expect(status.safe).toBe(false)
      expect(status.warnings).toContain('No information gathered yet')
    })

    it('should warn on negative sentiment in last message', () => {
      const negativeMessage: Message = {
        role: 'agent',
        content: 'I am very frustrated with this!',
        timestamp: Date.now()
      }

      const status = monitor.getSafetyStatus(mockGoalState, negativeMessage)

      expect(status.safe).toBe(false)
      expect(status.warnings).toContain('Negative sentiment detected')
    })

    it('should accumulate multiple warnings', () => {
      const problematicState: GoalState = {
        ...mockGoalState,
        turns_taken: 9,
        info_gathered: []
      }

      const negativeMessage: Message = {
        role: 'agent',
        content: 'This is terrible!',
        timestamp: Date.now()
      }

      const status = monitor.getSafetyStatus(problematicState, negativeMessage)

      expect(status.safe).toBe(false)
      expect(status.warnings.length).toBeGreaterThanOrEqual(2)
      expect(status.warnings).toContain('Only 1 turns remaining')
      expect(status.warnings).toContain('No information gathered yet')
      expect(status.warnings).toContain('Negative sentiment detected')
    })

    it('should return correct stats', () => {
      const status = monitor.getSafetyStatus(mockGoalState)

      expect(status.stats.turns_remaining).toBe(8)
      expect(status.stats.confidence_threshold).toBe(0.7)
      expect(status.stats.escalation_keywords_count).toBe(4)
    })
  })

  describe('updateConstraints', () => {
    it('should update escalation keywords', () => {
      monitor.updateConstraints({
        escalation_keywords: ['urgent', 'critical']
      })

      const constraints = monitor.getConstraints()
      expect(constraints.escalation_keywords).toEqual(['urgent', 'critical'])
    })

    it('should update min_confidence', () => {
      monitor.updateConstraints({
        min_confidence: 0.85
      })

      expect(monitor.checkConfidence(0.8)).toBe(false)
      expect(monitor.checkConfidence(0.85)).toBe(true)
    })

    it('should update max_turns', () => {
      monitor.updateConstraints({
        max_turns: 5
      })

      const state: GoalState = {
        ...mockGoalState,
        turns_taken: 5
      }

      const message: Message = {
        role: 'agent',
        content: 'Test',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, state)
      expect(result.shouldEscalate).toBe(true)
    })

    it('should update stop_if_confused', () => {
      monitor.updateConstraints({
        stop_if_confused: false
      })

      const constraints = monitor.getConstraints()
      expect(constraints.stop_if_confused).toBe(false)
    })

    it('should update multiple constraints at once', () => {
      monitor.updateConstraints({
        max_turns: 15,
        min_confidence: 0.8,
        escalation_keywords: ['test'],
        stop_if_confused: false
      })

      const constraints = monitor.getConstraints()
      expect(constraints.max_turns).toBe(15)
      expect(constraints.min_confidence).toBe(0.8)
      expect(constraints.escalation_keywords).toEqual(['test'])
      expect(constraints.stop_if_confused).toBe(false)
    })

    it('should preserve unmodified constraints', () => {
      monitor.updateConstraints({
        max_turns: 20
      })

      const constraints = monitor.getConstraints()
      expect(constraints.max_turns).toBe(20)
      expect(constraints.escalation_keywords).toEqual(['angry', 'manager', 'complaint', 'lawyer']) // Original
      expect(constraints.stop_if_confused).toBe(true) // Original
      expect(constraints.min_confidence).toBe(0.7) // Original
    })
  })

  describe('edge cases', () => {
    it('should handle empty message content', () => {
      const message: Message = {
        role: 'agent',
        content: '',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, mockGoalState)
      expect(result.shouldEscalate).toBe(false)
    })

    it('should handle zero turns taken', () => {
      const zeroTurnsState: GoalState = {
        ...mockGoalState,
        turns_taken: 0
      }

      const message: Message = {
        role: 'agent',
        content: 'First message',
        timestamp: Date.now()
      }

      const result = monitor.checkMessage(message, zeroTurnsState)
      expect(result.shouldEscalate).toBe(false)
    })

    it('should handle empty escalation keywords array', () => {
      const noKeywordsConstraints: SafetyConstraints = {
        ...defaultConstraints,
        escalation_keywords: []
      }

      const noKeywordsMonitor = new SafetyMonitor(noKeywordsConstraints)

      const message: Message = {
        role: 'agent',
        content: 'I am angry and want a manager!',
        timestamp: Date.now()
      }

      const result = noKeywordsMonitor.checkMessage(message, mockGoalState)
      expect(result.shouldEscalate).toBe(false)
    })
  })
})
