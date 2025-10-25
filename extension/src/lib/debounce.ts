/**
 * Debounce Utility
 * Delays function execution until after a specified delay has passed since the last call
 *
 * Used primarily for DOM observation to prevent excessive API calls when
 * multiple messages are added rapidly to the chat
 */

/**
 * Creates a debounced function that delays invoking func until after delay milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param delay - The number of milliseconds to delay (default: 500ms)
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>): void {
    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Creates a debounced function with leading edge execution
 * The function will be called immediately on the first invocation,
 * then debounced for subsequent calls
 *
 * @param func - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced version of the function with leading edge execution
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let isFirstCall = true

  return function (this: any, ...args: Parameters<T>): void {
    // Execute immediately on first call
    if (isFirstCall) {
      func.apply(this, args)
      isFirstCall = false
    }

    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      isFirstCall = true
      timeoutId = null
    }, delay)
  }
}

/**
 * Creates a throttled function that only invokes func at most once per delay period
 * Unlike debounce, throttle guarantees execution at regular intervals
 *
 * @param func - The function to throttle
 * @param delay - The number of milliseconds to wait between executions
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (this: any, ...args: Parameters<T>): void {
    const now = Date.now()

    if (now - lastCall >= delay) {
      func.apply(this, args)
      lastCall = now
    }
  }
}
