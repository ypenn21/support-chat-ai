import type { Suggestion } from '@/types'
import { SuggestionCard } from './SuggestionCard'

interface SuggestionPanelProps {
  suggestion?: Suggestion
  isLoading?: boolean
  error?: string
  onCopy?: () => void
  onDismiss?: () => void
}

export function SuggestionPanel({
  suggestion,
  isLoading = false,
  error,
  onCopy,
  onDismiss
}: SuggestionPanelProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Generating AI suggestion...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-lg border border-red-200 p-4 max-w-md">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Suggestion state
  if (suggestion) {
    return (
      <SuggestionCard
        suggestion={suggestion}
        onCopy={onCopy || (() => {})}
        onDismiss={onDismiss}
      />
    )
  }

  // No content state (shouldn't normally render)
  return null
}
