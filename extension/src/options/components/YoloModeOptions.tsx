import type { Goal } from '@/types'

export function YoloModeOptions() {
  const goalPresets: Goal[] = [
    {
      type: 'resolve_issue',
      description: 'Resolve customer shipping delay',
      required_info: ['order_number', 'tracking_id', 'expected_delivery'],
      max_turns: 10
    },
    {
      type: 'gather_info',
      description: 'Gather customer information for support ticket',
      required_info: ['name', 'email', 'issue_description'],
      max_turns: 5
    },
    {
      type: 'escalate',
      description: 'Gather info and escalate to specialist',
      required_info: ['issue_category', 'urgency', 'account_id'],
      max_turns: 3
    }
  ]

  const handleSelectPreset = async (goal: Goal) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'SET_GOAL',
        payload: {
          goal,
          constraints: {
            max_turns: goal.max_turns,
            escalation_keywords: ['angry', 'manager', 'complaint'],
            stop_if_confused: true
          }
        }
      })
      alert('Goal preset loaded!')
    } catch (error) {
      console.error('Failed to load goal preset:', error)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">YOLO Mode Configuration</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Goal Presets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goalPresets.map((preset, i) => (
              <div key={i} className="border rounded p-3">
                <div className="font-medium">{preset.description}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Max turns: {preset.max_turns}
                </div>
                {preset.required_info && (
                  <div className="text-xs text-gray-500 mt-1">
                    Required: {preset.required_info.join(', ')}
                  </div>
                )}
                <button
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => handleSelectPreset(preset)}
                >
                  Load Preset
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Safety Rules</h3>
          <div className="space-y-2">
            <div>
              <label htmlFor="default-max-turns" className="block text-sm">Default Max Turns</label>
              <input id="default-max-turns" type="number" className="border rounded p-2 w-32" defaultValue={10} />
            </div>
            <div>
              <label htmlFor="preview-delay" className="block text-sm">Preview Delay (seconds)</label>
              <input id="preview-delay" type="number" className="border rounded p-2 w-32" defaultValue={3} />
            </div>
            <div>
              <label htmlFor="min-confidence" className="block text-sm">Minimum Confidence Threshold</label>
              <input id="min-confidence" type="number" step="0.1" className="border rounded p-2 w-32" defaultValue={0.7} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
