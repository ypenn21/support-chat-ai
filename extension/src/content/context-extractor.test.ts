import { describe, it, expect, vi } from 'vitest'
import {
  extractConversationContext,
  getLastCustomerMessage,
  getLastAgentMessage,
  isLastMessageFromCustomer,
  countMessagesByRole
} from './context-extractor'
import type { PlatformDetector } from './platforms/types'
import type { Message } from '@/types'

// Mock platform detector
const createMockPlatform = (messages: Partial<Message>[]): PlatformDetector => ({
  detect: () => true,
  getChatContainer: () => document.createElement('div'),
  getMessageElements: () =>
    messages.map(() => document.createElement('div')),
  getMessageText: vi.fn((element) => {
    const index = messages.findIndex((_, i) => i === Array.from(element.parentElement?.children || []).indexOf(element))
    return messages[index]?.content || ''
  }),
  getMessageRole: vi.fn((element) => {
    const index = messages.findIndex((_, i) => i === Array.from(element.parentElement?.children || []).indexOf(element))
    return messages[index]?.role || 'customer'
  }),
  getInputBox: () => null,
  getSendButton: () => null,
  getPlatformName: () => 'test'
})

describe('extractConversationContext', () => {
  it('should extract messages from DOM', () => {
    const mockMessages = [
      { role: 'customer' as const, content: 'Hello' },
      { role: 'agent' as const, content: 'Hi there!' }
    ]

    const platform = createMockPlatform(mockMessages)
    const context = extractConversationContext(platform)

    expect(context).toHaveLength(2)
    expect(context[0].content).toBe('Hello')
    expect(context[1].content).toBe('Hi there!')
  })

  it('should limit to max messages (default 10)', () => {
    const mockMessages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ('customer' as const) : ('agent' as const),
      content: `Message ${i}`
    }))

    const platform = createMockPlatform(mockMessages)
    const context = extractConversationContext(platform)

    expect(context.length).toBeLessThanOrEqual(10)
  })

  it('should skip empty messages', () => {
    const mockMessages = [
      { role: 'customer' as const, content: 'Hello' },
      { role: 'agent' as const, content: '' },
      { role: 'customer' as const, content: 'Anyone there?' }
    ]

    const platform = createMockPlatform(mockMessages)
    const context = extractConversationContext(platform)

    expect(context).toHaveLength(2)
    expect(context.every(msg => msg.content.trim() !== '')).toBe(true)
  })

  it('should add timestamps to messages', () => {
    const mockMessages = [
      { role: 'customer' as const, content: 'Hello' }
    ]

    const platform = createMockPlatform(mockMessages)
    const context = extractConversationContext(platform)

    expect(context[0].timestamp).toBeDefined()
    expect(typeof context[0].timestamp).toBe('number')
  })
})

describe('getLastCustomerMessage', () => {
  it('should return the last customer message', () => {
    const messages: Message[] = [
      { role: 'customer', content: 'First', timestamp: 1 },
      { role: 'agent', content: 'Response', timestamp: 2 },
      { role: 'customer', content: 'Second', timestamp: 3 }
    ]

    const lastCustomer = getLastCustomerMessage(messages)

    expect(lastCustomer).not.toBeNull()
    expect(lastCustomer?.content).toBe('Second')
  })

  it('should return null if no customer messages', () => {
    const messages: Message[] = [
      { role: 'agent', content: 'Hello', timestamp: 1 }
    ]

    const lastCustomer = getLastCustomerMessage(messages)

    expect(lastCustomer).toBeNull()
  })
})

describe('getLastAgentMessage', () => {
  it('should return the last agent message', () => {
    const messages: Message[] = [
      { role: 'agent', content: 'First', timestamp: 1 },
      { role: 'customer', content: 'Question', timestamp: 2 },
      { role: 'agent', content: 'Second', timestamp: 3 }
    ]

    const lastAgent = getLastAgentMessage(messages)

    expect(lastAgent).not.toBeNull()
    expect(lastAgent?.content).toBe('Second')
  })
})

describe('isLastMessageFromCustomer', () => {
  it('should return true if last message is from customer', () => {
    const messages: Message[] = [
      { role: 'agent', content: 'Hello', timestamp: 1 },
      { role: 'customer', content: 'Hi', timestamp: 2 }
    ]

    expect(isLastMessageFromCustomer(messages)).toBe(true)
  })

  it('should return false if last message is from agent', () => {
    const messages: Message[] = [
      { role: 'customer', content: 'Hello', timestamp: 1 },
      { role: 'agent', content: 'Hi', timestamp: 2 }
    ]

    expect(isLastMessageFromCustomer(messages)).toBe(false)
  })

  it('should return false if no messages', () => {
    expect(isLastMessageFromCustomer([])).toBe(false)
  })
})

describe('countMessagesByRole', () => {
  it('should count messages by role', () => {
    const messages: Message[] = [
      { role: 'customer', content: '1', timestamp: 1 },
      { role: 'agent', content: '2', timestamp: 2 },
      { role: 'customer', content: '3', timestamp: 3 },
      { role: 'customer', content: '4', timestamp: 4 },
      { role: 'agent', content: '5', timestamp: 5 }
    ]

    const counts = countMessagesByRole(messages)

    expect(counts.customer).toBe(3)
    expect(counts.agent).toBe(2)
  })

  it('should return zero counts for empty array', () => {
    const counts = countMessagesByRole([])

    expect(counts.customer).toBe(0)
    expect(counts.agent).toBe(0)
  })
})
