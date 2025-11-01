import type { Message, SafetyConstraints, GoalState } from '@/types'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Safety Monitor')

/**
 * Safety Check Result
 */
export interface SafetyCheck {
  shouldEscalate: boolean
  reason?: string
  triggers: string[]
}

/**
 * Safety Monitor
 * Performs client-side safety checks for YOLO mode
 * Detects escalation triggers, sentiment, and confidence issues
 */
export class SafetyMonitor {
  private escalationKeywords: string[]
  private minConfidence: number
  private maxTurns: number
  private stopIfConfused: boolean

  constructor(constraints: SafetyConstraints) {
    this.escalationKeywords = constraints.escalation_keywords || []
    this.minConfidence = constraints.min_confidence || 0.7
    this.maxTurns = constraints.max_turns || 10
    this.stopIfConfused = constraints.stop_if_confused !== false

    logger.info('Safety monitor initialized', {
      escalation_keywords: this.escalationKeywords.length,
      min_confidence: this.minConfidence,
      max_turns: this.maxTurns
    })
  }

  /**
   * Check if message triggers escalation
   */
  checkMessage(message: Message, goalState: GoalState): SafetyCheck {
    const triggers: string[] = []

    // Check for escalation keywords
    const keywordTrigger = this.checkEscalationKeywords(message)
    if (keywordTrigger) {
      triggers.push(`keyword: "${keywordTrigger}"`)
      logger.warn(`Escalation keyword detected: ${keywordTrigger}`)
      return {
        shouldEscalate: true,
        reason: 'Escalation keyword detected in customer message',
        triggers
      }
    }

    // Check for max turns
    if (goalState.turns_taken >= this.maxTurns) {
      triggers.push('max turns reached')
      logger.warn(`Max turns reached: ${goalState.turns_taken}/${this.maxTurns}`)
      return {
        shouldEscalate: true,
        reason: 'Maximum conversation turns reached',
        triggers
      }
    }

    // Check for negative sentiment
    const sentiment = this.analyzeSentiment(message)
    if (sentiment === 'negative') {
      triggers.push('negative sentiment')
      logger.info('Negative sentiment detected - monitoring closely')
      // Don't escalate immediately on negative sentiment, but log it
    }

    // Check for repeated questions (confusion detection)
    if (this.stopIfConfused) {
      // Simple heuristic: if we've taken multiple turns without progress
      if (goalState.turns_taken > 3 && goalState.info_gathered.length === 0) {
        triggers.push('no progress')
        logger.warn('No progress detected after multiple turns')
        return {
          shouldEscalate: true,
          reason: 'No progress made after multiple conversation turns',
          triggers
        }
      }
    }

    return {
      shouldEscalate: false,
      triggers
    }
  }

  /**
   * Check if confidence meets minimum threshold
   */
  checkConfidence(confidence: number): boolean {
    const meetsThreshold = confidence >= this.minConfidence
    if (!meetsThreshold) {
      logger.warn(`Confidence ${confidence} below threshold ${this.minConfidence}`)
    }
    return meetsThreshold
  }

  /**
   * Check for escalation keywords in message
   * Returns the keyword that triggered, or null if none found
   */
  private checkEscalationKeywords(message: Message): string | null {
    const content = message.content.toLowerCase()

    for (const keyword of this.escalationKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        return keyword
      }
    }

    return null
  }

  /**
   * Analyze sentiment of message
   * Simple keyword-based sentiment analysis for MVP
   */
  analyzeSentiment(message: Message): 'positive' | 'neutral' | 'negative' {
    const negativeWords = [
      'angry', 'frustrated', 'terrible', 'awful', 'hate',
      'horrible', 'worst', 'disgusted', 'unacceptable',
      'furious', 'upset', 'disappointed', 'mad'
    ]

    const positiveWords = [
      'thanks', 'thank you', 'great', 'helpful', 'appreciate',
      'excellent', 'wonderful', 'perfect', 'awesome',
      'love', 'happy', 'pleased', 'satisfied'
    ]

    const content = message.content.toLowerCase()

    const hasNegative = negativeWords.some(word => content.includes(word))
    const hasPositive = positiveWords.some(word => content.includes(word))

    if (hasNegative && !hasPositive) return 'negative'
    if (hasPositive && !hasNegative) return 'positive'
    return 'neutral'
  }

  /**
   * Get detailed safety status
   */
  getSafetyStatus(goalState: GoalState, lastMessage?: Message): {
    safe: boolean
    warnings: string[]
    stats: {
      turns_remaining: number
      confidence_threshold: number
      escalation_keywords_count: number
    }
  } {
    const warnings: string[] = []

    // Check turns remaining
    const turnsRemaining = this.maxTurns - goalState.turns_taken
    if (turnsRemaining <= 2) {
      warnings.push(`Only ${turnsRemaining} turns remaining`)
    }

    // Check for no progress
    if (goalState.turns_taken > 3 && goalState.info_gathered.length === 0) {
      warnings.push('No information gathered yet')
    }

    // Check sentiment if message provided
    if (lastMessage) {
      const sentiment = this.analyzeSentiment(lastMessage)
      if (sentiment === 'negative') {
        warnings.push('Negative sentiment detected')
      }
    }

    return {
      safe: warnings.length === 0,
      warnings,
      stats: {
        turns_remaining: turnsRemaining,
        confidence_threshold: this.minConfidence,
        escalation_keywords_count: this.escalationKeywords.length
      }
    }
  }

  /**
   * Update safety constraints
   */
  updateConstraints(constraints: Partial<SafetyConstraints>): void {
    if (constraints.escalation_keywords !== undefined) {
      this.escalationKeywords = constraints.escalation_keywords
    }
    if (constraints.min_confidence !== undefined) {
      this.minConfidence = constraints.min_confidence
    }
    if (constraints.max_turns !== undefined) {
      this.maxTurns = constraints.max_turns
    }
    if (constraints.stop_if_confused !== undefined) {
      this.stopIfConfused = constraints.stop_if_confused
    }

    logger.info('Safety constraints updated')
  }

  /**
   * Get current constraints
   */
  getConstraints(): SafetyConstraints {
    return {
      escalation_keywords: this.escalationKeywords,
      min_confidence: this.minConfidence,
      max_turns: this.maxTurns,
      stop_if_confused: this.stopIfConfused
    }
  }
}
