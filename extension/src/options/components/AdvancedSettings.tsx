import { useState, useEffect } from 'react'
import type { UserPreferences } from '@/types'
import { getPreferences, savePreferences } from '@/lib/storage'

/**
 * AdvancedSettings Component
 * Advanced configuration options for the extension
 * - All user preferences
 * - Debug mode toggle
 * - Export/Import settings
 */
export function AdvancedSettings() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    tone: 'empathetic',
    length: 'medium',
    language: 'en',
    include_greeting: false
  })
  const [debugMode, setDebugMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    // Load preferences
    getPreferences().then((p) => {
      if (p) setPrefs(p)
    })

    // Load debug mode
    chrome.storage.local.get(['debugMode'], (result) => {
      if (result.debugMode !== undefined) {
        setDebugMode(result.debugMode)
      }
    })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      await savePreferences(prefs)
      await chrome.storage.local.set({ debugMode })
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage('Failed to save settings')
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    const allPrefs = await getPreferences()
    const data = {
      version: '1.0.0',
      preferences: allPrefs,
      debugMode,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `support-ai-settings-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (data.preferences) {
          await savePreferences(data.preferences)
          setPrefs(data.preferences)
        }

        if (data.debugMode !== undefined) {
          await chrome.storage.local.set({ debugMode: data.debugMode })
          setDebugMode(data.debugMode)
        }

        setSaveMessage('Settings imported successfully!')
        setTimeout(() => setSaveMessage(null), 3000)
      } catch (error) {
        setSaveMessage('Failed to import settings')
        console.error('Failed to import:', error)
      }
    }
    input.click()
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>

      <div className="space-y-6">
        {/* User Preferences */}
        <div>
          <h3 className="font-medium mb-3">Response Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tone</label>
              <select
                className="w-full border rounded p-2"
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
                className="w-full border rounded p-2"
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
                className="w-full border rounded p-2"
                value={prefs.language || 'en'}
                onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="advanced-greeting"
                className="mr-2"
                checked={prefs.include_greeting || false}
                onChange={(e) => setPrefs({ ...prefs, include_greeting: e.target.checked })}
              />
              <label htmlFor="advanced-greeting" className="text-sm font-medium">
                Always include greeting in responses
              </label>
            </div>
          </div>
        </div>

        {/* Debug Mode */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Developer Options</h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="debug-mode"
              className="mr-2"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
            />
            <label htmlFor="debug-mode" className="text-sm font-medium">
              Enable debug mode (verbose logging)
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Shows detailed logs in the browser console
          </p>
        </div>

        {/* Export/Import */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Settings Management</h3>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
              onClick={handleExport}
            >
              Export Settings
            </button>
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
              onClick={handleImport}
            >
              Import Settings
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Save your settings to a file or restore from a backup
          </p>
        </div>

        {/* Save Button */}
        <div className="border-t pt-4">
          <button
            className="w-full md:w-auto px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </button>

          {saveMessage && (
            <div
              className={`mt-3 text-sm p-3 rounded ${
                saveMessage.includes('success')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
