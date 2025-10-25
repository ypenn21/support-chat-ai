import { describe, it, expect } from 'vitest'
import { generateMockSuggestion } from './mock-api'
import type { SuggestRequest } from '@/types'

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
          role: 'customer',
          content: 'Where is my shipping information?',
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
          role: 'customer',
          content: 'I want a refund for my purchase',
          timestamp: Date.now()
        }
      ]
    }

    const response = await generateMockSuggestion(request)
    const suggestion = response.suggestions[0]

    expect(suggestion.content.toLowerCase()).toContain('refund')
  })

  it('should have confidence score between 0.7 and 0.95', async () => {
    const request: SuggestRequest = {
      platform: 'generic',
      conversation_context: [
        {
          role: 'customer',
          content: 'Hello',
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
          role: 'customer',
          content: 'Help me',
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
