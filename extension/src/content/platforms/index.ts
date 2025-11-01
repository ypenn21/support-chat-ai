import type { Platform } from '@/types'
import type { PlatformDetector } from './types'
import { coinbaseDetector } from './coinbase'
import { robinhoodDetector } from './robinhood'
import { genericDetector } from './generic'

/**
 * Detect the current chat platform
 * Returns the appropriate platform detector
 */
export function detectPlatform(): PlatformDetector | null {
  // Try Coinbase first
  if (coinbaseDetector.detect()) {
    console.log('[Platform] Detected: Coinbase')
    return coinbaseDetector
  }

  // Try Robinhood
  if (robinhoodDetector.detect()) {
    console.log('[Platform] Detected: Robinhood')
    return robinhoodDetector
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

  if (platformName === 'coinbase') return 'coinbase'
  if (platformName === 'robinhood') return 'robinhood'
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
export { coinbaseDetector, robinhoodDetector, genericDetector }
export type { PlatformDetector }
