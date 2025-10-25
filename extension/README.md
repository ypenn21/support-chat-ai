# Chrome Extension - Support Chat AI Assistant

This directory contains the Chrome extension that provides AI-powered response suggestions for support agents.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Development

### Install Dependencies

```bash
npm install
```

This installs:
- React 18.2.0 + React DOM
- TypeScript 5.3.3
- Vite 5.0.11 with @crxjs/vite-plugin
- Tailwind CSS with shadcn/ui setup
- Zustand for state management
- React Query for API state
- Testing libraries (Vitest, React Testing Library)

### Configuration

1. **Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env and set VITE_API_URL to your backend URL
   ```

2. **Manifest Configuration**
   - Edit `public/manifest.json` if you need to add more host permissions
   - Current permissions: Zendesk and Intercom domains

### Development Server

```bash
npm run dev
```

- Starts Vite dev server with hot module replacement
- Builds extension to `dist/` directory
- Auto-reloads on file changes

### Load Extension in Chrome

1. Run `npm run dev` or `npm run build`
2. Open Chrome: `chrome://extensions`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `dist/` directory
6. Extension will appear with icon and name

### Available Scripts

```bash
npm run dev          # Development server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run type-check   # TypeScript type checking
npm test             # Run tests with Vitest
npm run test:ui      # Vitest UI
npm run test:coverage # Coverage report
```

## Project Structure

```
src/
├── background/          # Service worker (Manifest V3)
│   ├── index.ts         # Main service worker entry
│   ├── api-client.ts    # HTTP client for backend API
│   ├── auth-manager.ts  # API key/token management
│   └── message-router.ts # Message routing between contexts
│
├── content/             # Content scripts (injected into pages)
│   ├── index.ts         # Main content script entry
│   ├── dom-observer.ts  # MutationObserver for chat messages
│   ├── context-extractor.ts # Extract conversation context
│   ├── ui-injector.tsx  # React component for suggestions panel
│   └── platforms/       # Platform-specific selectors
│       ├── zendesk.ts   # Zendesk-specific DOM selectors
│       ├── intercom.ts  # Intercom-specific DOM selectors
│       └── generic.ts   # Fallback generic selectors
│
├── popup/               # Extension popup UI
│   ├── App.tsx          # Main popup component
│   ├── index.tsx        # Popup entry point
│   └── components/      # Popup-specific components
│       ├── Settings.tsx # User preferences
│       ├── History.tsx  # Recent suggestions
│       └── Status.tsx   # Connection status
│
├── options/             # Options page UI
│   ├── App.tsx          # Main options component
│   └── index.tsx        # Options entry point
│
├── components/          # Shared React components
│   └── ui/              # shadcn/ui components
│
├── lib/                 # Utilities
│   ├── storage.ts       # Chrome Storage API wrapper
│   ├── api.ts           # API client utilities
│   └── utils.ts         # General utilities (cn, etc.)
│
├── types/               # TypeScript types
│   └── index.ts         # Shared types
│
├── styles/              # Global styles
│   └── globals.css      # Tailwind + CSS variables
│
└── test/                # Test configuration
    └── setup.ts         # Vitest setup
```

## Key Patterns

### Chrome Extension Message Passing

**Content Script → Service Worker:**
```typescript
// In content script
chrome.runtime.sendMessage({
  type: 'GET_SUGGESTION',
  payload: { context, platform }
}, (response) => {
  console.log('Got suggestion:', response)
})
```

**Service Worker Listener:**
```typescript
// In background/index.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SUGGESTION') {
    callBackendAPI(message.payload)
      .then(sendResponse)
    return true // Required for async response
  }
})
```

### Chrome Storage API

```typescript
// Save to storage
await chrome.storage.local.set({ key: value })

// Load from storage
const result = await chrome.storage.local.get('key')
console.log(result.key)

// Use sync storage for user preferences
await chrome.storage.sync.set({ preferences: {...} })
```

### DOM Observation

```typescript
const observer = new MutationObserver((mutations) => {
  const newMessages = extractNewMessages(mutations)
  if (newMessages.length > 0) {
    requestSuggestion(newMessages)
  }
})

observer.observe(chatContainer, {
  childList: true,
  subtree: true
})
```

## Manifest V3 Constraints

⚠️ **Important:**
- Content scripts **CANNOT** make external API calls (CORS restrictions)
- All external API calls **MUST** go through the service worker
- Service workers **CANNOT** access DOM
- Use `chrome.runtime.sendMessage()` to communicate between contexts
- Service workers must use `chrome.storage` API (not localStorage)

## Testing

### Unit Tests
```bash
npm test
```

Tests are written with Vitest and React Testing Library.

**Example test:**
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText(/Support Chat AI/i)).toBeInTheDocument()
  })
})
```

### Chrome API Mocking

Chrome APIs are mocked in `src/test/setup.ts`:
```typescript
global.chrome = {
  runtime: { sendMessage: vi.fn() },
  storage: { local: { get: vi.fn(), set: vi.fn() } }
}
```

## Build & Deployment

### Development Build
```bash
npm run dev
```
- Unminified code
- Source maps included
- Fast rebuild on changes

### Production Build
```bash
npm run build
```
- Minified and optimized
- No source maps
- Output in `dist/` directory

### Chrome Web Store

1. Build production version:
   ```bash
   npm run build
   ```

2. Test the build:
   - Load `dist/` as unpacked extension
   - Test all features

3. Create a ZIP file:
   ```bash
   cd dist && zip -r ../extension.zip . && cd ..
   ```

4. Upload to Chrome Web Store Developer Dashboard

## Debugging

### Service Worker
- Open `chrome://extensions`
- Click "Inspect views: service worker" under your extension
- Use console for logging and debugging

### Content Scripts
- Open DevTools on the target page (Zendesk, Intercom)
- Content script logs appear in the page console
- Set breakpoints in Sources tab

### Popup/Options
- Right-click extension icon → "Inspect popup"
- Or right-click options page → "Inspect"

## Common Issues

**Extension not loading:**
- Check manifest.json syntax
- Ensure all referenced files exist
- Check for console errors in service worker

**Content script not injecting:**
- Verify `matches` patterns in manifest.json
- Check if page matches the URL pattern
- Ensure `run_at: "document_end"` is set

**API calls failing:**
- Content scripts can't make direct API calls
- Route through service worker instead
- Check CORS configuration on backend

**Type errors:**
- Run `npm run type-check` to see all errors
- Ensure @types/chrome is installed
- Check tsconfig.json configuration

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Vite Plugin CRXJS](https://crxjs.dev/vite-plugin/)
- [React Testing Library](https://testing-library.com/react)

## Next Steps

1. Implement background service worker (`src/background/index.ts`)
2. Implement content scripts (`src/content/index.ts`)
3. Create platform-specific selectors
4. Build React UI for popup and options
5. Add tests for critical paths
6. Test on actual Zendesk/Intercom pages

Use Claude Code's `/implement` command to help with implementation!
