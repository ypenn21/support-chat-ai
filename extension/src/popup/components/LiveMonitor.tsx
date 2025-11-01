import { useState, useEffect } from 'react'
import { getMode, getYoloState, onModeChange, onYoloStateChange } from '@/lib/storage'
import type { YoloState, Message } from '@/types'

export function LiveMonitor() {
  const [yoloState, setYoloState] = useState<YoloState | null>(null)
  const [mode, setMode] = useState<'suggestion' | 'yolo'>('suggestion')
  const [conversation, setConversation] = useState<Message[]>([])

  useEffect(() => {
    getMode().then(setMode)
    getYoloState().then(setYoloState)

    onModeChange(setMode)
    onYoloStateChange(setYoloState)

    // Listen for conversation updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'CONVERSATION_UPDATE') {
        setConversation(message.payload.messages)
      }
    })
  }, [])

  if (mode !== 'yolo' || !yoloState) {
    return null
  }

  const progress = (yoloState.goalState.turns_taken / yoloState.goal.max_turns) * 100

  return (
    <div className="border rounded-lg p-4 bg-orange-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">🤖 YOLO Mode Active</h3>
        <button
          className="text-sm bg-red-500 text-white px-3 py-1 rounded"
          onClick={() => {
            chrome.runtime.sendMessage({ type: 'EMERGENCY_STOP' })
          }}
        >
          🛑 Emergency Stop
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-sm font-medium">Goal</div>
          <div className="text-sm text-gray-700">{yoloState.goal.description}</div>
        </div>

        <div>
          <div className="text-sm font-medium">Progress</div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-orange-500 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {yoloState.goalState.turns_taken} / {yoloState.goal.max_turns} turns
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Info Gathered</div>
          <div className="flex flex-wrap gap-1">
            {yoloState.goalState.info_gathered.map((info, i) => (
              <span key={i} className="text-xs bg-green-100 px-2 py-1 rounded">
                ✓ {info}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Recent Messages</div>
          <div className="max-h-32 overflow-y-auto text-xs space-y-1">
            {conversation.slice(-5).map((msg, i) => (
              <div key={i} className={msg.role === 'customer' ? 'text-blue-700' : 'text-gray-700'}>
                <strong>{msg.role === 'customer' ? '👤' : '🤖'}:</strong> {msg.content.substring(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
