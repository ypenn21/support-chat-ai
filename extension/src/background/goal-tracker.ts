import type { Goal, GoalState, SafetyConstraints } from '@/types'
import { getYoloState, saveYoloState, clearYoloState } from '@/lib/storage'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Goal Tracker')

/**
 * Goal Tracker
 * Tracks goal progress during YOLO mode
 * Manages goal state, turns taken, info gathered, and completion detection
 */
export class GoalTracker {
  private currentGoal: Goal | null = null
  private currentState: GoalState | null = null
  private currentConstraints: SafetyConstraints | null = null
  private conversationId: string | null = null

  async initialize(): Promise<void> {
    logger.info('Initializing goal tracker...')
    const yoloState = await getYoloState()
    if (yoloState) {
      this.currentGoal = yoloState.goal
      this.currentState = yoloState.goalState
      this.currentConstraints = yoloState.safetyConstraints
      this.conversationId = yoloState.conversationId
      logger.info(`Loaded existing goal: ${yoloState.goal.description}`)
      logger.info(`Progress: ${yoloState.goalState.turns_taken}/${yoloState.goal.max_turns} turns`)
    } else {
      logger.info('No existing goal state found')
    }
  }

  async setGoal(goal: Goal, constraints?: SafetyConstraints): Promise<void> {
    logger.info(`Setting new goal: ${goal.description}`)

    this.currentGoal = goal
    this.currentState = {
      turns_taken: 0,
      info_gathered: [],
      current_step: 'initializing',
      started_at: Date.now(),
      last_updated: Date.now()
    }

    // Use provided constraints or create defaults
    this.currentConstraints = constraints || {
      max_turns: goal.max_turns,
      escalation_keywords: ['angry', 'manager', 'complaint', 'supervisor', 'lawyer'],
      stop_if_confused: true,
      min_confidence: 0.7
    }

    // Generate new conversation ID
    this.conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await this.saveState()
    logger.info('Goal set successfully')
  }

  async updateState(newState: Partial<GoalState>): Promise<void> {
    if (!this.currentState) {
      logger.warn('Cannot update state - no current state exists')
      return
    }

    this.currentState = {
      ...this.currentState,
      ...newState,
      last_updated: Date.now()
    }

    await this.saveState()
    logger.debug('Goal state updated:', newState)
  }

  async incrementTurn(): Promise<void> {
    if (!this.currentState) {
      logger.warn('Cannot increment turn - no current state exists')
      return
    }

    this.currentState.turns_taken += 1
    this.currentState.last_updated = Date.now()

    await this.saveState()
    logger.info(`Turn incremented to ${this.currentState.turns_taken}`)
  }

  async addInfoGathered(info: string): Promise<void> {
    if (!this.currentState) {
      logger.warn('Cannot add info - no current state exists')
      return
    }

    if (!this.currentState.info_gathered.includes(info)) {
      this.currentState.info_gathered.push(info)
      this.currentState.last_updated = Date.now()
      await this.saveState()
      logger.info(`Info gathered: ${info}`)
    }
  }

  isGoalComplete(): boolean {
    if (!this.currentGoal || !this.currentState) return false

    // Check if all required info is gathered
    if (this.currentGoal.required_info) {
      const allInfoGathered = this.currentGoal.required_info.every(info =>
        this.currentState!.info_gathered.includes(info)
      )
      if (allInfoGathered) {
        logger.info('Goal complete - all required information gathered')
        return true
      }
    }

    return false
  }

  hasReachedMaxTurns(): boolean {
    if (!this.currentGoal || !this.currentState) return false
    const reached = this.currentState.turns_taken >= this.currentGoal.max_turns
    if (reached) {
      logger.warn('Max turns reached')
    }
    return reached
  }

  getProgress(): number {
    if (!this.currentGoal || !this.currentState) return 0

    if (this.currentGoal.required_info && this.currentGoal.required_info.length > 0) {
      // Progress based on info gathered
      return (this.currentState.info_gathered.length / this.currentGoal.required_info.length) * 100
    }

    // Progress based on turns taken
    return Math.min((this.currentState.turns_taken / this.currentGoal.max_turns) * 100, 100)
  }

  getProgressSummary(): string {
    if (!this.currentGoal || !this.currentState) return 'No active goal'

    const progress = this.getProgress()
    const turnsInfo = `${this.currentState.turns_taken}/${this.currentGoal.max_turns} turns`

    if (this.currentGoal.required_info) {
      const infoInfo = `${this.currentState.info_gathered.length}/${this.currentGoal.required_info.length} info gathered`
      return `${progress.toFixed(0)}% complete (${turnsInfo}, ${infoInfo})`
    }

    return `${progress.toFixed(0)}% complete (${turnsInfo})`
  }

  private async saveState(): Promise<void> {
    if (!this.currentGoal || !this.currentState || !this.currentConstraints || !this.conversationId) {
      logger.warn('Cannot save state - missing required data')
      return
    }

    await saveYoloState({
      active: true,
      goal: this.currentGoal,
      goalState: this.currentState,
      safetyConstraints: this.currentConstraints,
      conversationId: this.conversationId
    })

    logger.debug('Goal state saved to storage')
  }

  async clear(): Promise<void> {
    logger.info('Clearing goal state')
    this.currentGoal = null
    this.currentState = null
    this.currentConstraints = null
    this.conversationId = null
    await clearYoloState()
  }

  getState(): {
    goal: Goal | null
    state: GoalState | null
    constraints: SafetyConstraints | null
    conversationId: string | null
  } {
    return {
      goal: this.currentGoal,
      state: this.currentState,
      constraints: this.currentConstraints,
      conversationId: this.conversationId
    }
  }

  hasActiveGoal(): boolean {
    return this.currentGoal !== null && this.currentState !== null
  }

  getRequiredInfo(): string[] {
    return this.currentGoal?.required_info || []
  }

  getMissingInfo(): string[] {
    if (!this.currentGoal?.required_info || !this.currentState) return []

    return this.currentGoal.required_info.filter(
      info => !this.currentState!.info_gathered.includes(info)
    )
  }
}

// Singleton instance
export const goalTracker = new GoalTracker()
