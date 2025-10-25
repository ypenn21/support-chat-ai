// Message types
export type MessageRole = 'agent' | 'customer'

export interface Message {
  role: MessageRole
  content: string
  timestamp: number
}

// Platform types
export type Platform = 'zendesk' | 'intercom' | 'generic'

// User preferences
export type Tone = 'professional' | 'friendly' | 'empathetic'
export type Length = 'short' | 'medium' | 'long'

export interface UserPreferences {
  tone?: Tone
  length?: Length
  include_greeting?: boolean
}

// API request/response types
export interface SuggestRequest {
  platform: Platform
  conversation_context: Message[]
  user_preferences?: UserPreferences
}

export interface Suggestion {
  id: string
  content: string
  confidence: number
  reasoning?: string
}

export interface Metadata {
  model_used: string
  latency: number
  token_count: number
}

export interface SuggestResponse {
  suggestions: Suggestion[]
  metadata: Metadata
}

// Chrome runtime message types
export type RuntimeMessageType =
  | 'GET_SUGGESTION'
  | 'SAVE_PREFERENCES'
  | 'GET_PREFERENCES'

export interface RuntimeMessage {
  type: RuntimeMessageType
  payload?: unknown
}

// Storage types
export interface StorageData {
  preferences?: UserPreferences
  apiKey?: string
  lastSync?: number
}
