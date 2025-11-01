/**
 * Popup App Component
 * Main popup interface for the Chrome extension
 * Displays all mode controls, settings, and status
 */
import { ModeSelector } from './components/ModeSelector'
import { GoalConfig } from './components/GoalConfig'
import { LiveMonitor } from './components/LiveMonitor'
import { EmergencyStop } from './components/EmergencyStop'
import { Status } from './components/Status'
import { Settings } from './components/Settings'
import { History } from './components/History'

export default function App() {
  return (
    <div className="w-96 p-4 max-h-[600px] overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">Support Chat AI Assistant</h1>
        <p className="text-sm text-gray-600 mt-1">
          AI-powered support agent automation
        </p>
      </div>

      <div className="space-y-4">
        {/* Mode Selection */}
        <ModeSelector />

        {/* YOLO Mode Components (only visible when in YOLO mode) */}
        <GoalConfig />
        <LiveMonitor />
        <EmergencyStop />

        {/* Status Information */}
        <Status />

        {/* Settings */}
        <Settings />

        {/* Conversation History */}
        <History />
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center border-t pt-3">
        Support Chat AI v1.0.0
      </div>
    </div>
  )
}
