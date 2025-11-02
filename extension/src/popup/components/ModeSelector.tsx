import { useState, useEffect } from 'react'
import { getMode, getYoloState, onModeChange, onYoloStateChange } from '@/lib/storage'
import type { YoloState } from '@/types'

export function ModeSelector() {
  const [mode, setMode] = useState<'suggestion' | 'yolo'>('suggestion')
  const [yoloState, setYoloState] = useState<YoloState | null>(null)

  useEffect(() => {
    // Load current mode and yolo state
    getMode().then(setMode)
    getYoloState().then(setYoloState)

    // Listen for changes
    const cleanupMode = onModeChange(setMode)
    const cleanupYolo = onYoloStateChange(setYoloState)

    return () => {
      cleanupMode()
      cleanupYolo()
    }
  }, [])

  const handleModeChange = async (newMode: 'suggestion' | 'yolo') => {
    if (newMode === 'yolo' && !yoloState?.goal) {
      alert('Please configure a goal before activating YOLO mode')
      return
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'SET_MODE',
        payload: { mode: newMode }
      })
      setMode(newMode)
    } catch (error) {
      console.error('Failed to change mode:', error)
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Mode</h3>
      <div className="flex gap-2">
        <button
          className={`flex-1 py-2 px-4 rounded ${
            mode === 'suggestion'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
          onClick={() => handleModeChange('suggestion')}
        >
          Suggestion Mode
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded ${
            mode === 'yolo'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200'
          }`}
          onClick={() => handleModeChange('yolo')}
          disabled={!yoloState?.goal}
        >
          YOLO Mode
          {mode === 'yolo' && ' 🤖'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {mode === 'suggestion'
          ? 'AI suggests responses for you to review'
          : 'AI automatically responds to customers'}
      </p>
    </div>
  )
}
