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

// YOLO Mode types
export type GoalType = 'resolve_issue' | 'gather_info' | 'escalate' | 'custom'
export type Action = 'respond' | 'escalate' | 'need_info' | 'goal_complete'

export interface Goal {
  type: GoalType
  description: string
  required_info?: string[]
  max_turns: number
}

export interface GoalState {
  turns_taken: number
  info_gathered: string[]
  current_step: string
  started_at: number
  last_updated: number
}

export interface SafetyConstraints {
  max_turns: number
  escalation_keywords: string[]
  stop_if_confused: boolean
  min_confidence?: number
}

export interface AutonomousRequest {
  platform: Platform
  conversation_context: Message[]
  goal: Goal
  goal_state: GoalState
  safety_constraints: SafetyConstraints
  user_preferences?: UserPreferences
}

export interface AutonomousResponse {
  action: Action
  response?: Suggestion
  reason?: string
  goal_state: GoalState
  metadata: Metadata
}

export interface YoloState {
  active: boolean
  goal: Goal
  goalState: GoalState
  safetyConstraints: SafetyConstraints
  conversationId: string
}

export interface ConversationLog {
  id: string
  goal: Goal
  messages: Message[]
  goal_state: GoalState
  started_at: number
  ended_at?: number
  outcome: 'completed' | 'escalated' | 'stopped'
}

// Chrome runtime message types
export type RuntimeMessageType =
  | 'GET_SUGGESTION'
  | 'GET_AUTONOMOUS_RESPONSE'
  | 'SAVE_PREFERENCES'
  | 'GET_PREFERENCES'
  | 'SET_MODE'
  | 'GET_MODE'
  | 'SET_GOAL'
  | 'UPDATE_GOAL_STATE'
  | 'EMERGENCY_STOP'
  | 'MODE_CHANGED'
  | 'CONVERSATION_UPDATE'

export interface RuntimeMessage {
  type: RuntimeMessageType
  payload?: unknown
}

// Storage types
export interface StorageData {
  preferences?: UserPreferences
  apiKey?: string
  lastSync?: number
  mode?: 'suggestion' | 'yolo'
  yoloState?: YoloState
  conversationLogs?: ConversationLog[]
}
