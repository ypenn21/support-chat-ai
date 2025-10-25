import type { Platform } from '@/types'
import type { PlatformDetector } from './types'
import { zendeskDetector } from './zendesk'
import { intercomDetector } from './intercom'
import { genericDetector } from './generic'

/**
 * Detect the current chat platform
 * Returns the appropriate platform detector
 */
export function detectPlatform(): PlatformDetector | null {
  // Try Zendesk first
  if (zendeskDetector.detect()) {
    console.log('[Platform] Detected: Zendesk')
    return zendeskDetector
  }

  // Try Intercom
  if (intercomDetector.detect()) {
    console.log('[Platform] Detected: Intercom')
    return intercomDetector
  }

  // Check if there's any chat-like interface using generic detector
  const genericContainer = genericDetector.getChatContainer()
  if (genericContainer) {
    console.log('[Platform] Using generic detector (unknown platform)')
    return genericDetector
  }

  // No chat interface detected
  console.warn('[Platform] No chat interface detected on this page')
  return null
}

/**
 * Get platform type as string for API requests
 */
export function detectPlatformType(): Platform {
  const detector = detectPlatform()

  if (!detector) {
    return 'generic'
  }

  const platformName = detector.getPlatformName()

  if (platformName === 'zendesk') return 'zendesk'
  if (platformName === 'intercom') return 'intercom'
  return 'generic'
}

/**
 * Wait for platform to load
 * Some platforms load asynchronously, so we need to wait
 */
export async function waitForPlatform(
  maxWaitMs: number = 10000,
  checkIntervalMs: number = 500
): Promise<PlatformDetector | null> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const checkPlatform = () => {
      const detector = detectPlatform()

      if (detector) {
        resolve(detector)
        return
      }

      // Check if timeout exceeded
      if (Date.now() - startTime >= maxWaitMs) {
        console.warn('[Platform] Timeout waiting for platform to load')
        resolve(null)
        return
      }

      // Check again after interval
      setTimeout(checkPlatform, checkIntervalMs)
    }

    checkPlatform()
  })
}

// Export platform detectors for testing
export { zendeskDetector, intercomDetector, genericDetector }
export type { PlatformDetector }
