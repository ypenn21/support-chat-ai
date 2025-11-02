import { describe, it, expect, beforeEach } from 'vitest'
import { generateMockSuggestion, generateMockAutonomousResponse } from './mock-api'
import type { SuggestRequest, AutonomousRequest, GoalState, SafetyConstraints, Goal } from '@/types'

describe('generateMockSuggestion', () => {
  it('should generate a suggestion with correct structure', async () => {
    const request: SuggestRequest = {
      platform: 'zendesk',
      conversation_context: [
        {
          role: 'customer',
          content: 'Where is my order?',
          timestamp: Date.now()
        }
      ]
    }

    const response = await generateMockSuggestion(request)

    expect(response).toHaveProperty('suggestions')
    expect(response).toHaveProperty('metadata')
    expect(response.suggestions).toHaveLength(1)
    expect(response.suggestions[0]).toHaveProperty('id')
    expect(response.suggestions[0]).toHaveProperty('content')
    expect(response.suggestions[0]).toHaveProperty('confidence')
    expect(response.suggestions[0]).toHaveProperty('reasoning')
  })

  it('should generate contextual response for shipping query', async () => {
    const request: SuggestRequest = {
      platform: 'zendesk',
      conversation_context: [
        {
          role: 'agent',
          content: 'Can you provide your order number?',
          timestamp: Date.now()
        }
      ]
    }

    const response = await generateMockSuggestion(request)
    const suggestion = response.suggestions[0]

    expect(suggestion.content.toLowerCase()).toContain('order')
  })

  it('should generate contextual response for refund query', async () => {
    const request: SuggestRequest = {
      platform: 'zendesk',
      conversation_context: [
        {
          role: 'agent',
          content: 'Would you like to process a refund?',
          timestamp: Date.now()
        }
      ]
    }

    const response = await generateMockSuggestion(request)
    const suggestion = response.suggestions[0]

    expect(suggestion.content.toLowerCase()).toContain('return')
  })

  it('should have confidence score between 0.7 and 0.95', async () => {
    const request: SuggestRequest = {
      platform: 'generic',
      conversation_context: [
        {
          role: 'agent',
          content: 'How can I help you today?',
          timestamp: Date.now()
        }
      ]
    }

    const response = await generateMockSuggestion(request)
    const confidence = response.suggestions[0].confidence

    expect(confidence).toBeGreaterThanOrEqual(0.7)
    expect(confidence).toBeLessThanOrEqual(0.95)
  })

  it('should respect user preferences for tone', async () => {
    const request: SuggestRequest = {
      platform: 'generic',
      conversation_context: [
        {
          role: 'agent',
          content: 'Can you provide more details?',
          timestamp: Date.now()
        }
      ],
      user_preferences: {
        tone: 'professional',
        length: 'medium'
      }
    }

    const response = await generateMockSuggestion(request)
    const suggestion = response.suggestions[0]

    // Professional tone should avoid contractions
    expect(suggestion.content).not.toContain("I'd")
    expect(suggestion.content).not.toContain("I'm")
  })

  it('should simulate realistic latency', async () => {
    const request: SuggestRequest = {
      platform: 'generic',
      conversation_context: []
    }

    const start = Date.now()
    await generateMockSuggestion(request)
    const duration = Date.now() - start

    // Should take at least 500ms (minimum latency)
    expect(duration).toBeGreaterThanOrEqual(500)
    // Should take at most 1500ms (maximum latency)
    expect(duration).toBeLessThanOrEqual(1600) // Add small buffer for execution
  })

  it('should include metadata with model info', async () => {
    const request: SuggestRequest = {
      platform: 'generic',
      conversation_context: []
    }

    const response = await generateMockSuggestion(request)

    expect(response.metadata.model_used).toBe('gemini-1.5-pro-mock')
    expect(response.metadata.latency).toBeGreaterThan(0)
    expect(response.metadata.token_count).toBeGreaterThan(0)
  })
})

describe('generateMockAutonomousResponse', () => {
  let baseGoalState: GoalState
  let baseConstraints: SafetyConstraints
  let baseGoal: Goal

  beforeEach(() => {
    baseGoalState = {
      turns_taken: 2,
      info_gathered: ['order_number'],
      current_step: 'gathering_info',
      started_at: Date.now() - 60000,
      last_updated: Date.now()
    }

    baseConstraints = {
      max_turns: 10,
      escalation_keywords: ['angry', 'manager', 'complaint', 'lawyer'],
      stop_if_confused: true,
      min_confidence: 0.7
    }

    baseGoal = {
      type: 'resolve_issue',
      description: 'Resolve shipping issue',
      required_info: ['order_number', 'tracking_status'],
      max_turns: 10
    }
  })

  describe('action determination', () => {
    it('should return escalate action when escalation keyword detected', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'I am very angry about this delay!',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.action).toBe('escalate')
      expect(response.reason).toContain('Escalation trigger detected')
      expect(response.response).toBeUndefined()
    })

    it('should return escalate action when max turns reached', async () => {
      const maxTurnsState: GoalState = {
        ...baseGoalState,
        turns_taken: 10
      }

      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'What is the status?',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: maxTurnsState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.action).toBe('escalate')
      expect(response.reason).toContain('max turns')
    })

    it('should return goal_complete when all required info gathered', async () => {
      const completeGoal: Goal = {
        type: 'gather_info',
        description: 'Gather order details',
        required_info: ['order_number', 'email'],
        max_turns: 10
      }

      const completeState: GoalState = {
        ...baseGoalState,
        info_gathered: ['order_number', 'email']
      }

      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'My email is customer@example.com',
            timestamp: Date.now()
          }
        ],
        goal: completeGoal,
        goal_state: completeState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.action).toBe('goal_complete')
      expect(response.reason).toContain('All required information')
    })

    it('should return need_info when no agent message in context', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'customer',
            content: 'Hello, how can I help you?',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.action).toBe('need_info')
      expect(response.reason).toContain('Waiting for agent')
    })

    it('should return respond action for normal conversation', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'Can you provide your tracking number?',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.action).toBe('respond')
      expect(response.response).toBeDefined()
      expect(response.response?.content).toBeTruthy()
    })
  })

  describe('goal-oriented responses', () => {
    it('should generate order number response for resolve_issue goal', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'Can you provide your order number?',
            timestamp: Date.now()
          }
        ],
        goal: {
          type: 'resolve_issue',
          description: 'Resolve customer shipping delay',
          required_info: ['order_number'],
          max_turns: 10
        },
        goal_state: {
          ...baseGoalState,
          info_gathered: [] // Start with empty info to test gathering
        },
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.action).toBe('respond')
      expect(response.response?.content.toLowerCase()).toContain('order')
    })

    it('should generate email response for gather_info goal', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'What is your email address?',
            timestamp: Date.now()
          }
        ],
        goal: {
          type: 'gather_info',
          description: 'Gather customer information',
          required_info: ['email'],
          max_turns: 5
        },
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.action).toBe('respond')
      expect(response.response?.content.toLowerCase()).toContain('email')
    })

    it('should generate refund request for resolve_issue with refund context', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'Would you like a refund or replacement?',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.action).toBe('respond')
      expect(response.response?.content.toLowerCase()).toMatch(/refund|replacement/)
    })
  })

  describe('goal state updates', () => {
    it('should increment turns_taken in goal state', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'What is your order number?',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.goal_state.turns_taken).toBe(baseGoalState.turns_taken + 1)
    })

    it('should update info_gathered when new info detected', async () => {
      const stateWithoutTracking: GoalState = {
        ...baseGoalState,
        info_gathered: ['order_number']
      }

      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'The tracking shows it is in transit',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: stateWithoutTracking,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      if (response.action === 'respond') {
        // tracking_status should be added to info_gathered
        expect(response.goal_state.info_gathered).toContain('tracking_status')
      }
    })

    it('should update current_step based on action', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'I want to speak to a manager',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      if (response.action === 'escalate') {
        expect(response.goal_state.current_step).toBe('escalating')
      }
    })
  })

  describe('response structure', () => {
    it('should return complete response structure', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'How can I help you?',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response).toHaveProperty('action')
      expect(response).toHaveProperty('goal_state')
      expect(response).toHaveProperty('metadata')
      expect(response.metadata).toHaveProperty('model_used')
      expect(response.metadata).toHaveProperty('latency')
      expect(response.metadata).toHaveProperty('token_count')
    })

    it('should include suggestion when action is respond', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'Please provide your order number',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      if (response.action === 'respond') {
        expect(response.response).toBeDefined()
        expect(response.response).toHaveProperty('id')
        expect(response.response).toHaveProperty('content')
        expect(response.response).toHaveProperty('confidence')
        expect(response.response).toHaveProperty('reasoning')
      }
    })

    it('should have high confidence for respond actions', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'What is your email?',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      if (response.action === 'respond' && response.response) {
        expect(response.response.confidence).toBeGreaterThanOrEqual(0.7)
        expect(response.response.confidence).toBeLessThanOrEqual(0.95)
      }
    })
  })

  describe('safety constraints validation', () => {
    it('should respect multiple escalation keywords', async () => {
      const keywords = ['angry', 'manager', 'complaint', 'lawyer']

      // Run tests in parallel to avoid timeout
      const promises = keywords.map(async (keyword) => {
        const request: AutonomousRequest = {
          platform: 'zendesk',
          conversation_context: [
            {
              role: 'agent',
              content: `I am ${keyword} about this`,
              timestamp: Date.now()
            }
          ],
          goal: baseGoal,
          goal_state: baseGoalState,
          safety_constraints: baseConstraints
        }

        const response = await generateMockAutonomousResponse(request)
        expect(response.action).toBe('escalate')
      })

      await Promise.all(promises)
    })

    it('should handle empty escalation keywords array', async () => {
      const noKeywordsConstraints: SafetyConstraints = {
        ...baseConstraints,
        escalation_keywords: []
      }

      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'I am angry and want a manager!',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: noKeywordsConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      // Should not escalate due to keywords since array is empty
      expect(response.action).not.toBe('escalate')
    })
  })

  describe('latency simulation', () => {
    it('should simulate realistic latency', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'Test message',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const start = Date.now()
      await generateMockAutonomousResponse(request)
      const duration = Date.now() - start

      // Should take at least 500ms
      expect(duration).toBeGreaterThanOrEqual(500)
      // Should take at most 1500ms
      expect(duration).toBeLessThanOrEqual(1600)
    })

    it('should include latency in metadata', async () => {
      const request: AutonomousRequest = {
        platform: 'zendesk',
        conversation_context: [
          {
            role: 'agent',
            content: 'Test',
            timestamp: Date.now()
          }
        ],
        goal: baseGoal,
        goal_state: baseGoalState,
        safety_constraints: baseConstraints
      }

      const response = await generateMockAutonomousResponse(request)

      expect(response.metadata.latency).toBeGreaterThan(0)
      expect(response.metadata.latency).toBeGreaterThanOrEqual(0.5) // At least 500ms in seconds
      expect(response.metadata.latency).toBeLessThanOrEqual(1.6) // At most 1600ms in seconds
    })
  })
})
