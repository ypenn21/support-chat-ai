/**
 * Popup App Component (Minimal for Phase 1)
 * Full implementation will be completed in Phase 3
 */

export default function App() {
  return (
    <div className="w-96 p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">Support Chat AI Assistant</h1>
        <p className="text-sm text-gray-600 mt-1">
          Extension active on supported chat platforms
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-blue-50">
        <h2 className="font-semibold text-blue-800 mb-2">Status</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="font-medium">Suggestion Mode</span>
          </div>
          <div className="flex justify-between">
            <span>Platform:</span>
            <span className="font-medium">Auto-detect</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="text-green-600 font-medium">● Active</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Phase 1: Core Infrastructure Complete
        <br />
        Full UI coming in Phase 3
      </div>
    </div>
  )
}
