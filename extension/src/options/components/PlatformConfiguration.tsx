import { useState } from 'react'

/**
 * Platform Configuration Component
 * Configure platform-specific settings and custom selectors
 * - Enable/disable specific platforms
 * - Custom DOM selectors (advanced users)
 * - Platform detection testing
 */
export function PlatformConfiguration() {
  const [enabledPlatforms, setEnabledPlatforms] = useState({
    coinbase: true,
    robinhood: true,
    generic: true
  })

  const [customSelectors, setCustomSelectors] = useState({
    chatContainer: '',
    messageElement: '',
    inputBox: '',
    sendButton: ''
  })

  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTogglePlatform = (platform: keyof typeof enabledPlatforms) => {
    setEnabledPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform]
    }))
  }

  const handleTestSelectors = () => {
    // Test if custom selectors can be found in current page
    try {
      const chatContainer = customSelectors.chatContainer
        ? document.querySelector(customSelectors.chatContainer)
        : null
      const inputBox = customSelectors.inputBox
        ? document.querySelector(customSelectors.inputBox)
        : null

      const results = []
      if (chatContainer) results.push('✓ Chat container found')
      else if (customSelectors.chatContainer) results.push('✗ Chat container not found')

      if (inputBox) results.push('✓ Input box found')
      else if (customSelectors.inputBox) results.push('✗ Input box not found')

      if (results.length === 0) {
        setTestResult('Please enter selectors to test')
      } else {
        setTestResult(results.join('\n'))
      }
    } catch (error) {
      setTestResult('Invalid selector syntax')
    }
  }

  const handleSave = () => {
    chrome.storage.local.set({
      enabledPlatforms,
      customSelectors
    })
    alert('Platform configuration saved!')
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Platform Configuration</h2>

      {/* Enabled Platforms */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Enabled Platforms</h3>
        <p className="text-sm text-gray-600 mb-3">
          Toggle which platforms the extension should activate on
        </p>
        <div className="space-y-2">
          <div className="flex items-center p-3 border rounded">
            <input
              type="checkbox"
              id="coinbase"
              className="mr-3"
              checked={enabledPlatforms.coinbase}
              onChange={() => handleTogglePlatform('coinbase')}
            />
            <div>
              <label htmlFor="coinbase" className="font-medium">
                Coinbase
              </label>
              <p className="text-xs text-gray-500">Cryptocurrency trading platform (*.coinbase.com)</p>
            </div>
          </div>

          <div className="flex items-center p-3 border rounded">
            <input
              type="checkbox"
              id="robinhood"
              className="mr-3"
              checked={enabledPlatforms.robinhood}
              onChange={() => handleTogglePlatform('robinhood')}
            />
            <div>
              <label htmlFor="robinhood" className="font-medium">
                Robinhood
              </label>
              <p className="text-xs text-gray-500">Stock/crypto trading platform (*.robinhood.com)</p>
            </div>
          </div>

          <div className="flex items-center p-3 border rounded">
            <input
              type="checkbox"
              id="generic"
              className="mr-3"
              checked={enabledPlatforms.generic}
              onChange={() => handleTogglePlatform('generic')}
            />
            <div>
              <label htmlFor="generic" className="font-medium">
                Generic Fallback
              </label>
              <p className="text-xs text-gray-500">
                Attempt to detect chat on unsupported platforms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Selectors (Advanced) */}
      <div className="border-t pt-6">
        <h3 className="font-medium mb-3">Custom DOM Selectors (Advanced)</h3>
        <p className="text-sm text-gray-600 mb-3">
          Override default selectors with custom CSS selectors for your platform
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Chat Container Selector</label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm font-mono"
              placeholder=".chat-wrapper"
              value={customSelectors.chatContainer}
              onChange={(e) =>
                setCustomSelectors({ ...customSelectors, chatContainer: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message Element Selector</label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm font-mono"
              placeholder=".message"
              value={customSelectors.messageElement}
              onChange={(e) =>
                setCustomSelectors({ ...customSelectors, messageElement: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Input Box Selector</label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm font-mono"
              placeholder="#message-input"
              value={customSelectors.inputBox}
              onChange={(e) =>
                setCustomSelectors({ ...customSelectors, inputBox: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Send Button Selector</label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm font-mono"
              placeholder=".send-button"
              value={customSelectors.sendButton}
              onChange={(e) =>
                setCustomSelectors({ ...customSelectors, sendButton: e.target.value })
              }
            />
          </div>

          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
            onClick={handleTestSelectors}
          >
            Test Selectors
          </button>

          {testResult && (
            <pre className="text-xs bg-gray-50 p-3 rounded border font-mono whitespace-pre-wrap">
              {testResult}
            </pre>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t pt-6 mt-6">
        <button
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
          onClick={handleSave}
        >
          Save Configuration
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Changes will take effect after reloading the extension
        </p>
      </div>
    </div>
  )
}
