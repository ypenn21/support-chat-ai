/**
 * Options App Component
 * Full options/settings page for the Chrome extension
 * Provides advanced configuration for all features
 */
import { YoloModeOptions } from './components/YoloModeOptions'
import { AdvancedSettings } from './components/AdvancedSettings'
import { PlatformConfiguration } from './components/PlatformConfiguration'

export default function App() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Support Chat AI Assistant - Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure your AI-powered support automation preferences
        </p>
      </header>

      <div className="space-y-6">
        {/* Advanced Response Settings */}
        <AdvancedSettings />

        {/* YOLO Mode Configuration */}
        <YoloModeOptions />

        {/* Platform Configuration */}
        <PlatformConfiguration />
      </div>

      <footer className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
        <p>Support Chat AI Extension v1.0.0</p>
        <p className="mt-1">
          For help and documentation, visit{' '}
          <a href="#" className="text-blue-600 hover:underline">
            support documentation
          </a>
        </p>
      </footer>
    </div>
  )
}
