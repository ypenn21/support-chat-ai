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

  // Get the last customer message
  const lastMessage = conversationContext[conversationContext.length - 1]
  const lastCustomerMessage = conversationContext
    .slice()
    .reverse()
    .find((msg) => msg.role === 'customer')

  if (!lastCustomerMessage) {
    return "I'm here to assist you. What can I help with?"
  }

  const content = lastCustomerMessage.content.toLowerCase()

  // Contextual responses based on keywords
  let response = ''

  // Shipping-related queries
  if (content.includes('shipping') || content.includes('delivery') || content.includes('tracking')) {
    response = "I understand you're inquiring about shipping. I'd be happy to help you track your order. Could you please provide your order number so I can look up the shipping status?"
  }
  // Refund-related queries
  else if (content.includes('refund') || content.includes('return') || content.includes('money back')) {
    response = "I apologize for any inconvenience. I'd be glad to help you with your refund request. To process this, I'll need your order number and the reason for the return. Our standard refund policy allows returns within 30 days of purchase."
  }
  // Account issues
  else if (content.includes('account') || content.includes('login') || content.includes('password')) {
    response = "I can help you with your account issue. For security purposes, I'll need to verify some information. Could you please confirm your email address associated with the account?"
  }
  // Product questions
  else if (content.includes('product') || content.includes('item') || content.includes('availability')) {
    response = "Thank you for your interest in our products! I'd be happy to help you find what you're looking for. Could you provide more details about the specific product or features you're interested in?"
  }
  // Order status
  else if (content.includes('order') || content.includes('purchase')) {
    response = "I can help you check on your order status. Please provide your order number, and I'll look up the current status for you right away."
  }
  // Complaints or negative sentiment
  else if (content.includes('angry') || content.includes('frustrated') || content.includes('terrible') || content.includes('awful')) {
    response = "I sincerely apologize for the frustration you've experienced. Your concern is important to us, and I want to make this right. Please tell me more about what happened so I can assist you properly."
  }
  // Thanks or positive sentiment
  else if (content.includes('thank') || content.includes('appreciate') || content.includes('great')) {
    response = "You're very welcome! I'm glad I could help. Is there anything else I can assist you with today?"
  }
  // Default generic response
  else {
    response = "Thank you for reaching out. I understand your concern and I'm here to help. Could you provide a bit more detail so I can assist you better?"
  }

  // Adjust tone based on preferences
  if (preferences?.tone === 'professional') {
    response = response.replace("I'd be", "I would be").replace("I'm", "I am")
  } else if (preferences?.tone === 'friendly') {
    response = response + " 😊"
  }

  // Adjust length based on preferences
  if (preferences?.length === 'short') {
    // Simplify to first sentence only
    response = response.split('.')[0] + '.'
  } else if (preferences?.length === 'long') {
    // Add additional context
    response += " Please let me know if you have any other questions or concerns."
  }

  // Add greeting if requested
  if (preferences?.include_greeting && lastMessage.role === 'agent') {
    const greetings = ['Hi there!', 'Hello!', 'Good day!']
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
