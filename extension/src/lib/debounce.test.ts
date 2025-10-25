import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, throttle } from './debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should debounce function calls', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should call function with correct arguments', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('arg1', 'arg2')

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should reset timer on subsequent calls', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn()
    vi.advanceTimersByTime(50)
    debouncedFn()
    vi.advanceTimersByTime(50)

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should use custom delay', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 500)

    debouncedFn()

    vi.advanceTimersByTime(400)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throttle function calls', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn()
    throttledFn()
    throttledFn()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should allow calls after delay', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttledFn()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should call function with correct arguments', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn('arg1', 'arg2')

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})
