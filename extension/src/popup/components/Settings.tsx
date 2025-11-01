import { useState, useEffect } from 'react'
import type { UserPreferences } from '@/types'
import { getPreferences, savePreferences } from '@/lib/storage'

/**
 * Settings Component
 * Allows users to configure AI response preferences
 * - Tone: professional, empathetic, casual, friendly
 * - Length: short, medium, long
 * - Include greeting: boolean
 */
export function Settings() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    tone: 'empathetic',
    length: 'medium',
    language: 'en',
    include_greeting: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    // Load preferences from storage on mount
    getPreferences().then((p) => {
      if (p) {
        setPrefs(p)
      }
    })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      await savePreferences(prefs)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage('Failed to save settings')
      console.error('Failed to save preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Response Preferences</h3>
      <p className="text-xs text-gray-600 mb-3">
        Customize how AI suggestions are generated
      </p>

      <form className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Tone</label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={prefs.tone || 'empathetic'}
            onChange={(e) =>
              setPrefs({ ...prefs, tone: e.target.value as UserPreferences['tone'] })
            }
          >
            <option value="professional">Professional</option>
            <option value="empathetic">Empathetic</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Response Length</label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={prefs.length || 'medium'}
            onChange={(e) =>
              setPrefs({ ...prefs, length: e.target.value as UserPreferences['length'] })
            }
          >
            <option value="short">Short (1-2 sentences)</option>
            <option value="medium">Medium (2-4 sentences)</option>
            <option value="long">Long (4+ sentences)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={prefs.language || 'en'}
            onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="greeting"
            className="mr-2"
            checked={prefs.include_greeting || false}
            onChange={(e) => setPrefs({ ...prefs, include_greeting: e.target.checked })}
          />
          <label htmlFor="greeting" className="text-sm">
            Always include greeting
          </label>
        </div>

        <button
          type="button"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {saveMessage && (
          <div
            className={`text-sm text-center p-2 rounded ${
              saveMessage.includes('success')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {saveMessage}
          </div>
        )}
      </form>
    </div>
  )
}
