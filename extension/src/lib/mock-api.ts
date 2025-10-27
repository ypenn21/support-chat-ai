import type { SuggestRequest, SuggestResponse, Suggestion } from '@/types'

// Helper function to generate unique IDs
function generateId(): string {
  return `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to simulate API latency
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Helper function to generate random latency between min and max
function randomLatency(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to generate random confidence score
function randomConfidence(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2))
}

// Helper function to generate contextual response based on conversation
function generateContextualResponse(
  conversationContext: SuggestRequest['conversation_context'],
  preferences?: SuggestRequest['user_preferences']
): string {
  if (conversationContext.length === 0) {
    return "Hi! How can I help you today?"
  }

  // Get the last agent message (what we're responding to)
  const lastAgentMessage = conversationContext
    .slice()
    .reverse()
    .find((msg) => msg.role === 'agent')

  if (!lastAgentMessage) {
    return "Hello, I need help with an issue I'm experiencing."
  }

  const content = lastAgentMessage.content.toLowerCase()

  // Contextual customer responses based on what the agent asked
  let response = ''

  // Agent asking for order number or details
  if (content.includes('order number') || content.includes('order details') || content.includes('provide')) {
    response = "Sure! My order number is #ORDER-12345. I placed it on December 20th and haven't received any updates since."
  }
  // Agent asking for tracking information
  else if (content.includes('tracking') || content.includes('shipping status')) {
    response = "Yes, I'd like to know where my package is. The tracking number is TRACK-789456. It's been showing 'in transit' for over a week now."
  }
  // Agent asking about refund/return
  else if (content.includes('refund') || content.includes('return')) {
    response = "Yes, I'd like to return this item. It's not what I expected and doesn't match the description. Can you help me start the return process?"
  }
  // Agent asking for account verification
  else if (content.includes('account') || content.includes('email') || content.includes('verify') || content.includes('username')) {
    response = "Sure, my account email is customer@example.com. I registered about 6 months ago."
  }
  // Agent offering to help or asking what's wrong
  else if (content.includes('help') || content.includes('assist') || content.includes('concern')) {
    response = "Thank you! I placed an order but haven't received it yet, and I'm getting worried. Can you check on the status for me?"
  }
  // Agent asking about password/login issues
  else if (content.includes('password') || content.includes('login')) {
    response = "I forgot my password and can't access my account. My username is customer123. Can you help me reset it?"
  }
  // Agent asking for more information
  else if (content.includes('more details') || content.includes('tell me more') || content.includes('explain')) {
    response = "Of course. I ordered a blue widget on December 15th, but when it arrived, it was damaged. I'd like a replacement or refund please."
  }
  // Agent acknowledging issue and working on it
  else if (content.includes('processing') || content.includes('looking into') || content.includes('checking')) {
    response = "Thank you for looking into this. I really appreciate your help. Please let me know what you find."
  }
  // Default response to agent
  else {
    response = "Thanks for your response. I appreciate your help with this issue. What information do you need from me?"
  }

  // Adjust tone based on preferences (customer tone)
  if (preferences?.tone === 'professional') {
    response = response.replace("I'd", "I would").replace("I'm", "I am").replace("Can you", "Could you")
  } else if (preferences?.tone === 'friendly') {
    response = response + " Thanks again! 😊"
  } else if (preferences?.tone === 'empathetic') {
    response = response.replace("Can you", "Could you please").replace("Thanks", "Thank you very much")
  }

  // Adjust length based on preferences
  if (preferences?.length === 'short') {
    // Simplify to first sentence only
    response = response.split('.')[0] + '.'
  } else if (preferences?.length === 'long') {
    // Add additional context from customer perspective
    response += " I'm hoping we can resolve this quickly. Please let me know if you need anything else from me."
  }

  // Add greeting if requested (customer greeting)
  if (preferences?.include_greeting) {
    const greetings = ['Hi!', 'Hello!', 'Hey there!', 'Hi there!']
    const greeting = greetings[Math.floor(Math.random() * greetings.length)]
    response = `${greeting} ${response}`
  }

  return response
}

// Generate reasoning for the suggestion
function generateReasoning(conversationContext: SuggestRequest['conversation_context']): string {
  const lastCustomerMessage = conversationContext
    .slice()
    .reverse()
    .find((msg) => msg.role === 'customer')

  if (!lastCustomerMessage) {
    return 'Standard greeting for new conversation'
  }

  const content = lastCustomerMessage.content.toLowerCase()

  if (content.includes('shipping') || content.includes('delivery')) {
    return 'Customer asking about shipping/delivery. Requesting order number to provide tracking information.'
  } else if (content.includes('refund') || content.includes('return')) {
    return 'Customer requesting refund. Explaining refund policy and requesting necessary information.'
  } else if (content.includes('account') || content.includes('login')) {
    return 'Account-related issue. Following security protocol by requesting email verification.'
  } else if (content.includes('angry') || content.includes('frustrated')) {
    return 'Detecting negative sentiment. Prioritizing empathy and de-escalation.'
  } else if (content.includes('thank')) {
    return "Customer expressing gratitude. Acknowledging and offering continued support."
  }

  return "Based on customer's message, providing helpful and empathetic response."
}

/**
 * Mock API client for Suggestion Mode
 * Simulates backend /api/suggest-response endpoint
 */
export async function generateMockSuggestion(
  request: SuggestRequest
): Promise<SuggestResponse> {
  // Simulate realistic API latency (500-1500ms)
  const latency = randomLatency(500, 1500)
  await delay(latency)

  // Generate contextual suggestion
  const suggestionContent = generateContextualResponse(
    request.conversation_context,
    request.user_preferences
  )

  const suggestion: Suggestion = {
    id: generateId(),
    content: suggestionContent,
    confidence: randomConfidence(0.7, 0.95),
    reasoning: generateReasoning(request.conversation_context)
  }

  const response: SuggestResponse = {
    suggestions: [suggestion],
    metadata: {
      model_used: 'gemini-1.5-pro-mock',
      latency: latency / 1000, // Convert to seconds
      token_count: suggestionContent.split(' ').length * 1.3 // Rough estimate
    }
  }

  return response
}

/**
 * Simulates calling the real backend API
 * This will be replaced with actual fetch() call when backend is deployed
 */
export async function getSuggestion(request: SuggestRequest): Promise<SuggestResponse> {
  // For now, use mock implementation
  // TODO: Replace with real API call when backend is deployed
  // const response = await fetch('https://your-cloud-run-url/api/suggest-response', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request)
  // })
  // return await response.json()

  return generateMockSuggestion(request)
}
