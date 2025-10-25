import { useState } from 'react'
import type { Suggestion } from '@/types'

interface SuggestionCardProps {
  suggestion: Suggestion
  onCopy: () => void
  onDismiss?: () => void
}

export function SuggestionCard({ suggestion, onCopy, onDismiss }: SuggestionCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestion.content)
      setCopied(true)
      onCopy()

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Determine confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const confidencePercentage = Math.round(suggestion.confidence * 100)

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="text-sm font-semibold text-gray-700">AI Suggestion</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
            {confidencePercentage}% confident
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss suggestion"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

      {/* Suggestion Content */}
      <div className="mb-4">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {suggestion.content}
        </p>
      </div>

      {/* Reasoning (if available) */}
      {suggestion.reasoning && (
        <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-600 italic">
            <span className="font-medium">Reasoning:</span> {suggestion.reasoning}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 py-2 px-4 rounded font-medium text-sm transition-colors ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {copied ? (
            <span className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </span>
          ) : (
            'Copy to Clipboard'
          )}
        </button>
      </div>
    </div>
  )
}
