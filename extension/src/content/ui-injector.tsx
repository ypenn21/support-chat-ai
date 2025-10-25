import { createRoot, type Root } from 'react-dom/client'
import type { Suggestion } from '@/types'
import { SuggestionPanel } from './components/SuggestionPanel'
import '@/styles/globals.css'

/**
 * UI Injector for Content Script
 * Mounts React components into the host page DOM
 */

let currentRoot: Root | null = null
let currentContainer: HTMLElement | null = null

/**
 * Mount suggestion panel into the page
 *
 * @param suggestion - The suggestion to display
 * @param options - Configuration options
 * @returns Cleanup function to unmount the panel
 */
export function mountSuggestionPanel(
  suggestion: Suggestion | null,
  options: {
    isLoading?: boolean
    error?: string
    onCopy?: () => void
    onDismiss?: () => void
    position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  } = {}
): () => void {
  const {
    isLoading = false,
    error,
    onCopy = () => console.log('Suggestion copied'),
    onDismiss = () => unmountSuggestionPanel(),
    position = 'bottom-right'
  } = options

  // Unmount existing panel if present
  unmountSuggestionPanel()

  // Create container element
  const container = document.createElement('div')
  container.id = 'support-ai-suggestion-panel'
  container.className = 'support-ai-extension'

  // Set position styles based on options
  const positionStyles: Record<string, string> = {
    'top-right': 'top: 20px; right: 20px;',
    'bottom-right': 'bottom: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;'
  }

  container.style.cssText = `
    position: fixed;
    z-index: 999999;
    ${positionStyles[position]}
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `

  // Append to body
  document.body.appendChild(container)

  // Create React root and render
  const root = createRoot(container)
  root.render(
    <SuggestionPanel
      suggestion={suggestion || undefined}
      isLoading={isLoading}
      error={error}
      onCopy={onCopy}
      onDismiss={onDismiss}
    />
  )

  // Store references for cleanup
  currentRoot = root
  currentContainer = container

  // Return cleanup function
  return unmountSuggestionPanel
}

/**
 * Unmount the current suggestion panel
 */
export function unmountSuggestionPanel(): void {
  if (currentRoot && currentContainer) {
    currentRoot.unmount()
    currentContainer.remove()
    currentRoot = null
    currentContainer = null
  }
}

/**
 * Show loading state
 */
export function showLoadingPanel(): () => void {
  return mountSuggestionPanel(null, {
    isLoading: true
  })
}

/**
 * Show error state
 */
export function showErrorPanel(error: string): () => void {
  return mountSuggestionPanel(null, {
    error,
    onDismiss: unmountSuggestionPanel
  })
}

/**
 * Update existing panel with new suggestion
 * More efficient than unmounting and remounting
 */
export function updateSuggestionPanel(suggestion: Suggestion): void {
  if (currentRoot && currentContainer) {
    currentRoot.render(
      <SuggestionPanel
        suggestion={suggestion}
        onCopy={() => console.log('Suggestion copied')}
        onDismiss={unmountSuggestionPanel}
      />
    )
  } else {
    // No existing panel, mount new one
    mountSuggestionPanel(suggestion)
  }
}
