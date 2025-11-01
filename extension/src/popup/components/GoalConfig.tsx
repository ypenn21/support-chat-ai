import { useState } from 'react'
import type { Goal, SafetyConstraints } from '@/types'

export function GoalConfig() {
  const [goalType, setGoalType] = useState<Goal['type']>('resolve_issue')
  const [description, setDescription] = useState('')
  const [maxTurns, setMaxTurns] = useState(10)
  const [keywords, setKeywords] = useState('angry,manager,complaint')

  const handleSave = async () => {
    const goal: Goal = {
      type: goalType,
      description,
      max_turns: maxTurns
    }

    const constraints: SafetyConstraints = {
      max_turns: maxTurns,
      escalation_keywords: keywords.split(',').map(k => k.trim()),
      stop_if_confused: true
    }

    // Save to storage via background
    await chrome.runtime.sendMessage({
      type: 'SET_GOAL',
      payload: { goal, constraints }
    })

    alert('Goal configured! You can now activate YOLO mode.')
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Goal Configuration</h3>

      <div className="space-y-3">
        <div>
          <label htmlFor="goal-type" className="block text-sm font-medium mb-1">Goal Type</label>
          <select
            id="goal-type"
            className="w-full border rounded p-2"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as Goal['type'])}
          >
            <option value="resolve_issue">Resolve Issue</option>
            <option value="gather_info">Gather Information</option>
            <option value="escalate">Escalate to Specialist</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label htmlFor="goal-description" className="block text-sm font-medium mb-1">Description</label>
          <input
            id="goal-description"
            type="text"
            className="w-full border rounded p-2"
            placeholder="e.g., Resolve shipping delay issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="max-turns" className="block text-sm font-medium mb-1">Max Turns</label>
          <input
            id="max-turns"
            type="number"
            className="w-full border rounded p-2"
            min={1}
            max={20}
            value={maxTurns}
            onChange={(e) => setMaxTurns(parseInt(e.target.value))}
          />
        </div>

        <div>
          <label htmlFor="escalation-keywords" className="block text-sm font-medium mb-1">
            Escalation Keywords (comma-separated)
          </label>
          <input
            id="escalation-keywords"
            type="text"
            className="w-full border rounded p-2"
            placeholder="angry,manager,complaint"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <button
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          onClick={handleSave}
        >
          Save Goal
        </button>
      </div>
    </div>
  )
}
