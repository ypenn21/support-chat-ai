import { useState, useEffect } from 'react'
import { getMode, onModeChange } from '@/lib/storage'

/**
 * Status Component
 * Displays current extension status information
 * - Current mode (Suggestion vs YOLO)
 * - Last activity timestamp
 * - Connection status
 */
export function Status() {
  const [mode, setMode] = useState<'suggestion' | 'yolo'>('suggestion')
  const [lastActivity, setLastActivity] = useState<string>('Never')
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Load current mode
    getMode().then((m) => setMode(m))

    // Listen for mode changes
    const cleanup = onModeChange((newMode) => {
      setMode(newMode)
      setLastActivity(new Date().toLocaleTimeString())
    })

    // Check online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Try to get last activity from storage
    chrome.storage.local.get(['lastActivity'], (result) => {
      if (result.lastActivity) {
        const lastTime = new Date(result.lastActivity)
        setLastActivity(lastTime.toLocaleTimeString())
      }
    })

    return () => {
      cleanup()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Status</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Current Mode:</span>
          <span className="font-medium">
            {mode === 'suggestion' ? '📝 Suggestion' : '🤖 YOLO'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Last Activity:</span>
          <span className="font-medium text-gray-700">{lastActivity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Connection:</span>
          <span className={isOnline ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {isOnline ? '● Online' : '● Offline'}
          </span>
        </div>
      </div>
    </div>
  )
}
