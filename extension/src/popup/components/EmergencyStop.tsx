import { useState, useEffect } from 'react'
import { getMode, onModeChange } from '@/lib/storage'

export function EmergencyStop() {
  const [mode, setMode] = useState<'suggestion' | 'yolo'>('suggestion')

  useEffect(() => {
    getMode().then(setMode)
    onModeChange(setMode)
  }, [])

  const handleEmergencyStop = async () => {
    if (confirm('Are you sure you want to stop YOLO mode and take manual control?')) {
      await chrome.runtime.sendMessage({ type: 'EMERGENCY_STOP' })
      setMode('suggestion')
    }
  }

  if (mode !== 'yolo') {
    return null
  }

  return (
    <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
      <button
        className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 text-lg"
        onClick={handleEmergencyStop}
      >
        🛑 EMERGENCY STOP
      </button>
      <p className="text-xs text-center text-gray-600 mt-2">
        Immediately halt autonomous mode and return to manual control
      </p>
    </div>
  )
}
