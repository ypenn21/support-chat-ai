import { useState, useEffect } from 'react'
import type { ConversationLog } from '@/types'
import { getConversationLogs, clearConversationLogs } from '@/lib/storage'

/**
 * History Component
 * Displays recent conversation logs from YOLO mode sessions
 * - Shows conversation ID, goal type, completion status
 * - Allows clearing history
 * - Displays message count and timestamps
 */
export function History() {
  const [logs, setLogs] = useState<ConversationLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const conversationLogs = await getConversationLogs()
      setLogs(conversationLogs)
    } catch (error) {
      console.error('Failed to load conversation logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all conversation history?')) {
      try {
        await clearConversationLogs()
        setLogs([])
      } catch (error) {
        console.error('Failed to clear logs:', error)
        alert('Failed to clear history')
      }
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Conversation History</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Conversation History</h3>
        <p className="text-sm text-gray-500">No conversation history yet</p>
        <p className="text-xs text-gray-400 mt-1">
          YOLO mode conversations will appear here
        </p>
      </div>
    )
  }

  const displayedLogs = isExpanded ? logs : logs.slice(0, 3)

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Conversation History</h3>
        <button
          className="text-xs text-red-600 hover:text-red-700"
          onClick={handleClearHistory}
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        {displayedLogs.map((log) => (
          <div key={log.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-sm font-medium">{log.goal.description}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {log.messages.length} messages · {log.goal.type}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{formatDate(log.started_at)}</div>
              </div>
              <div>
                {log.outcome === 'completed' ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    Complete
                  </span>
                ) : log.outcome === 'escalated' ? (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                    Escalated
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    Stopped
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {logs.length > 3 && (
        <button
          className="text-xs text-blue-600 hover:text-blue-700 mt-2 w-full text-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : `Show ${logs.length - 3} More`}
        </button>
      )}
    </div>
  )
}
