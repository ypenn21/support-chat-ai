import { getMode, setMode, getYoloState, clearYoloState } from '@/lib/storage'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Mode Controller')

/**
 * Mode Controller
 * Manages switching between Suggestion and YOLO modes
 * Validates mode transitions and broadcasts mode changes
 */
export class ModeController {
  private currentMode: 'suggestion' | 'yolo' = 'suggestion'

  async initialize(): Promise<void> {
    logger.info('Initializing mode controller...')
    const mode = await getMode()
    this.currentMode = mode || 'suggestion'
    logger.info(`Current mode: ${this.currentMode}`)
  }

  async switchMode(newMode: 'suggestion' | 'yolo'): Promise<void> {
    logger.info(`Switching mode from ${this.currentMode} to ${newMode}`)

    // Validate YOLO mode activation
    if (newMode === 'yolo') {
      const yoloState = await getYoloState()
      if (!yoloState || !yoloState.goal) {
        const error = 'Cannot activate YOLO mode without a configured goal'
        logger.error(error)
        throw new Error(error)
      }
      logger.info('YOLO mode validation passed - goal is configured')
    }

    // Update mode
    this.currentMode = newMode
    await setMode(newMode)

    // Broadcast mode change to all contexts
    await this.broadcastModeChange(newMode)

    logger.info(`Mode switched successfully to ${newMode}`)
  }

  async emergencyStop(): Promise<void> {
    logger.warn('EMERGENCY STOP triggered!')

    if (this.currentMode === 'yolo') {
      // Switch back to suggestion mode
      await this.switchMode('suggestion')

      // Clear YOLO state
      await clearYoloState()

      // Notify user
      try {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'YOLO Mode Stopped',
          message: 'Autonomous mode has been stopped. Returning to manual control.',
          priority: 2
        })
      } catch (error) {
        logger.error('Failed to create notification:', error)
      }

      logger.info('Emergency stop completed - returned to suggestion mode')
    } else {
      logger.warn('Emergency stop called but not in YOLO mode')
    }
  }

  private async broadcastModeChange(mode: 'suggestion' | 'yolo'): Promise<void> {
    logger.debug('Broadcasting mode change to all tabs')

    try {
      // Send message to all tabs
      const tabs = await chrome.tabs.query({})
      const promises = tabs.map(tab => {
        if (tab.id) {
          return chrome.tabs.sendMessage(tab.id, {
            type: 'MODE_CHANGED',
            payload: { mode }
          }).catch(error => {
            // Tab might not have content script loaded - this is okay
            logger.debug(`Could not send message to tab ${tab.id}:`, error.message)
          })
        }
        return Promise.resolve()
      })

      await Promise.all(promises)
      logger.debug('Mode change broadcast complete')
    } catch (error) {
      logger.error('Failed to broadcast mode change:', error)
    }
  }

  getCurrentMode(): 'suggestion' | 'yolo' {
    return this.currentMode
  }

  isYoloMode(): boolean {
    return this.currentMode === 'yolo'
  }

  isSuggestionMode(): boolean {
    return this.currentMode === 'suggestion'
  }
}

// Singleton instance
export const modeController = new ModeController()
