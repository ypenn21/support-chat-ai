import type {
  SuggestRequest,
  SuggestResponse,
  Suggestion,
  AutonomousRequest,
  AutonomousResponse,
  Action,
  GoalState
} from '@/types'

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

/**
 * Helper function to determine action based on conversation and safety rules
 */
function determineAction(request: AutonomousRequest): Action {
  const lastMessage = request.conversation_context[request.conversation_context.length - 1]

  // Only process if last message is from agent (what we're responding to)
  if (!lastMessage || lastMessage.role !== 'agent') {
    return 'need_info'
  }

  const content = lastMessage.content.toLowerCase()

  // Check for escalation keywords
  const hasEscalationKeyword = request.safety_constraints.escalation_keywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  )

  if (hasEscalationKeyword) {
    return 'escalate'
  }

  // Check max turns
  if (request.goal_state.turns_taken >= request.safety_constraints.max_turns) {
    return 'escalate'
  }

  // Check if goal is complete (simple heuristic based on required info)
  if (request.goal.required_info) {
    const allInfoGathered = request.goal.required_info.every(info =>
      request.goal_state.info_gathered.includes(info)
    )
    if (allInfoGathered) {
      return 'goal_complete'
    }
  }

  // Default: generate a response
  return 'respond'
}

/**
 * Helper function to generate goal-oriented response based on goal type
 */
function generateGoalOrientedResponse(request: AutonomousRequest): string {
  const lastAgentMessage = request.conversation_context
    .slice()
    .reverse()
    .find(msg => msg.role === 'agent')

  if (!lastAgentMessage) {
    return "Hello! I need assistance with an issue."
  }

  const content = lastAgentMessage.content.toLowerCase()
  const goalType = request.goal.type

  // Goal-oriented responses
  if (goalType === 'resolve_issue') {
    // Focus on resolving the problem
    if (content.includes('order number')) {
      return "Sure! My order number is #ORDER-12345. I placed it on December 20th. The issue is that it hasn't arrived yet and tracking shows it's stuck."
    } else if (content.includes('tracking')) {
      return "The tracking number is TRACK-789456. It's been showing 'in transit' for over a week without any updates. Can you help resolve this?"
    } else if (content.includes('refund') || content.includes('replacement')) {
      return "Yes, I'd like a refund please. The item doesn't meet my expectations. Can you process that for me?"
    } else if (content.includes('solution') || content.includes('resolve')) {
      return "Thank you! A replacement or refund would work for me. What are the next steps to get this resolved?"
    } else {
      return "I appreciate your help. My main concern is getting this resolved as soon as possible. What information do you need from me?"
    }
  } else if (goalType === 'gather_info') {
    // Focus on providing information
    if (content.includes('name')) {
      return "My name is John Smith. What else do you need from me?"
    } else if (content.includes('email')) {
      return "My email is john.smith@example.com. Is there anything else you need?"
    } else if (content.includes('describe') || content.includes('issue')) {
      return "I'm having trouble accessing my account. I've tried resetting my password but I'm not receiving the email. Can you help?"
    } else {
      return "I'm happy to provide whatever information you need. What would be most helpful?"
    }
  } else if (goalType === 'escalate') {
    // Focus on getting escalated to specialist
    if (content.includes('specialist') || content.includes('manager')) {
      return "Yes, please! I believe this requires someone with more expertise. My account ID is ACC-789. Thank you."
    } else if (content.includes('help')) {
      return "I think this issue is complex and might need a specialist. Can you escalate this to someone who can help? My urgency is high."
    } else {
      return "I appreciate your help, but I think this needs to be escalated. It's a complex issue. Can you transfer me to a specialist?"
    }
  } else {
    // Custom goal - use general helpful response
    return generateContextualResponse(request.conversation_context, request.user_preferences)
  }
}

/**
 * Helper function to update goal state based on response
 */
function updateGoalState(request: AutonomousRequest, _response: string): GoalState {
  const newState = { ...request.goal_state }
  newState.turns_taken += 1
  newState.last_updated = Date.now()

  // Get the last agent message to check what info was provided
  const lastAgentMessage = request.conversation_context
    .slice()
    .reverse()
    .find(msg => msg.role === 'agent')

  // Simple heuristic: check if agent message mentions required info
  if (request.goal.required_info && lastAgentMessage) {
    const agentContent = lastAgentMessage.content.toLowerCase()
    request.goal.required_info.forEach(info => {
      // Check for the info keyword (with or without underscores)
      const infoLower = info.toLowerCase().replace(/_/g, ' ')
      const infoKeyword = info.toLowerCase().split('_')[0] // First part of compound words

      if ((agentContent.includes(infoLower) || agentContent.includes(infoKeyword)) &&
          !newState.info_gathered.includes(info)) {
        newState.info_gathered.push(info)
      }
    })
  }

  // Update current step based on progress
  const progress = request.goal.required_info
    ? (newState.info_gathered.length / request.goal.required_info.length) * 100
    : (newState.turns_taken / request.safety_constraints.max_turns) * 100

  if (progress < 33) {
    newState.current_step = 'gathering_info'
  } else if (progress < 66) {
    newState.current_step = 'in_progress'
  } else {
    newState.current_step = 'finalizing'
  }

  return newState
}

/**
 * Mock API client for YOLO Mode (Autonomous Response)
 * Simulates backend /api/autonomous-response endpoint
 */
export async function generateMockAutonomousResponse(
  request: AutonomousRequest
): Promise<AutonomousResponse> {
  // Simulate realistic API latency (500-1500ms)
  const latency = randomLatency(500, 1500)
  await delay(latency)

  // Determine action based on safety rules and conversation state
  const action = determineAction(request)

  // Handle different actions
  if (action === 'escalate') {
    const escalatedState = {
      ...request.goal_state,
      current_step: 'escalating',
      last_updated: Date.now()
    }
    return {
      action: 'escalate',
      reason: 'Escalation trigger detected (keyword or max turns reached)',
      goal_state: escalatedState,
      metadata: {
        model_used: 'gemini-1.5-pro-mock',
        latency: latency / 1000,
        token_count: 0
      }
    }
  }

  if (action === 'goal_complete') {
    return {
      action: 'goal_complete',
      reason: 'All required information gathered - goal achieved',
      goal_state: request.goal_state,
      metadata: {
        model_used: 'gemini-1.5-pro-mock',
        latency: latency / 1000,
        token_count: 0
      }
    }
  }

  if (action === 'need_info') {
    return {
      action: 'need_info',
      reason: 'Waiting for agent response',
      goal_state: request.goal_state,
      metadata: {
        model_used: 'gemini-1.5-pro-mock',
        latency: latency / 1000,
        token_count: 0
      }
    }
  }

  // Action is 'respond' - generate autonomous response
  const responseContent = generateGoalOrientedResponse(request)
  const updatedGoalState = updateGoalState(request, responseContent)

  const suggestion: Suggestion = {
    id: generateId(),
    content: responseContent,
    confidence: randomConfidence(0.75, 0.92),
    reasoning: `Goal-oriented response for ${request.goal.type} (turn ${updatedGoalState.turns_taken}/${request.safety_constraints.max_turns})`
  }

  return {
    action: 'respond',
    response: suggestion,
    goal_state: updatedGoalState,
    metadata: {
      model_used: 'gemini-1.5-pro-mock',
      latency: latency / 1000,
      token_count: responseContent.split(' ').length * 1.3
    }
  }
}

/**
 * Simulates calling the real backend YOLO API
 * This will be replaced with actual fetch() call when backend is deployed
 */
export async function getAutonomousResponse(
  request: AutonomousRequest
): Promise<AutonomousResponse> {
  // For now, use mock implementation
  // TODO: Replace with real API call when backend is deployed
  // const response = await fetch('https://your-cloud-run-url/api/autonomous-response', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request)
  // })
  // return await response.json()

  return generateMockAutonomousResponse(request)
}
