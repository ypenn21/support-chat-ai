# Chrome Extension - Support Chat AI Assistant

This directory contains the Chrome extension that provides AI-powered response automation for customers interacting with support agents.

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

#### Step 1: Build the Extension

```bash
# Production build (recommended for testing)
npm run build

# OR Development build (with hot reload)
npm run dev
```

**Note:** The extension files will be generated in the `dist/` directory.

#### Step 2: Load the Extension

1. **Open Chrome Extensions Page**
   - Navigate to: `chrome://extensions`
   - Or click the puzzle icon → "Manage Extensions"

2. **Enable Developer Mode**
   - Look for the toggle switch in the **top-right corner**
   - Turn it **ON**

3. **Load Unpacked Extension**
   - Click the **"Load unpacked"** button (top-left area)
   - Navigate to: `/path/to/support-chat-ai/extension/dist/`
   - Click **"Select"** or **"Open"**

4. **Verify Extension Loaded**
   - ✅ "Support Chat AI Assistant" should appear in the extensions list
   - ✅ Version: 0.1.0
   - ✅ Status: Enabled
   - ✅ No error messages

5. **Extension Icon**
   - The extension icon should appear in your Chrome toolbar
   - Click it to open the popup interface

#### Step 3: Reload After Code Changes

If you're developing and made code changes:

1. **Rebuild the extension:**
   ```bash
   npm run build
   ```

2. **Reload in Chrome:**
   - Go to `chrome://extensions`
   - Find "Support Chat AI Assistant"
   - Click the **refresh/reload icon** (circular arrow)
   - Or click "Remove" and re-add the extension

3. **Refresh test pages:**
   - Reload any pages where you're testing the extension

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

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run with coverage
npm run test:coverage
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

### Manual Testing in Chrome

#### Option 1: Test with the Included Test Page

A test page (`test-page.html`) is included for quick testing:

1. **Load the extension** (see instructions above)

2. **Open the test page:**
   ```bash
   # From the extension directory
   open test-page.html

   # Or open it directly in Chrome
   ```

3. **Open Chrome DevTools:**
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Go to the **Console** tab

4. **Test the extension:**
   - Click the **"➕ Simulate New Customer Message"** button
   - A new customer message will be added to the chat

5. **Expected behavior:**
   - Console logs show extension detecting the platform
   - After 500-1500ms (simulated API delay), a suggestion panel appears
   - Panel displays in the **bottom-right corner**
   - Shows AI-generated suggestion relevant to the message
   - Displays confidence score (70-95%)
   - Has a "Copy to Clipboard" button

6. **Verify it works:**
   - Click "Copy to Clipboard" - text should copy
   - Dismiss button (X) should remove the panel
   - Add another message - new suggestion should appear

#### Option 2: Test on Real Support Platforms

The extension is designed for Zendesk and Intercom:

1. **Navigate to a support platform:**
   - Zendesk: Any `*.zendesk.com` page with chat
   - Intercom: Any `*.intercom.io` page with chat
   - Other: Generic chat interfaces (fallback mode)

2. **Open DevTools Console** to see extension logs

3. **Expected console logs:**
   ```
   [Platform] Detected: zendesk (or intercom/generic)
   [Content Script] Content script initializing...
   [Content Script] Platform detected: zendesk
   [DOM Observer] Started observing zendesk chat
   ```

4. **Interact with the chat:**
   - When a new support agent message appears
   - The extension should auto-detect it
   - A customer response suggestion panel should appear bottom-right

5. **Check for errors:**
   - No red errors in console
   - Suggestion panel renders correctly
   - Copy button works

#### Debugging Extension Issues

**View Service Worker Logs:**
1. Go to `chrome://extensions`
2. Find "Support Chat AI Assistant"
3. Click **"service worker"** (under "Inspect views")
4. Service worker DevTools will open
5. Check Console for background worker logs

**View Content Script Logs:**
1. Open the target page (test page or support platform)
2. Press `F12` to open DevTools
3. Go to Console tab
4. Content script logs appear here with prefixes like:
   - `[Platform]`
   - `[DOM Observer]`
   - `[Context Extractor]`
   - `[Content Script]`

**View Popup/Options Logs:**
1. Right-click the extension icon
2. Select **"Inspect popup"**
3. DevTools for popup will open

**Common Console Logs:**
```
✅ Success logs:
[Platform] Detected: generic
[DOM Observer] Started observing generic chat (mode: suggestion)
[Content Script] New messages detected, handling...
[Background] Received message: GET_SUGGESTION

❌ Error logs to watch for:
[Platform] No chat interface detected on this page
[DOM Observer] No chat container found
[Content Script] Failed to get suggestion: [error message]
```

#### What You Should See

**On the test page:**
1. **Console logs:**
   ```
   [Content Script] Content script initializing...
   [Platform] Using generic detector (unknown platform)
   [DOM Observer] Started observing generic chat (mode: suggestion)
   ```

2. **After clicking "Simulate Message":**
   ```
   [DOM Observer] Detected 1 new message(s)
   [Content Script] New messages detected, handling...
   [Content Script] Requesting suggestion from background worker...
   [Background] Received message: GET_SUGGESTION
   [API Client] Fetching suggestion from API
   [Content Script] Displaying suggestion: suggestion-[id]
   ```

3. **Suggestion Panel:**
   - Appears in bottom-right corner
   - White card with shadow
   - Blue pulsing dot indicator
   - AI-generated response text
   - Confidence percentage (e.g., "87% confident")
   - Reasoning section (why this suggestion)
   - "Copy to Clipboard" button

**Example Screenshot (text description):**
```
┌─────────────────────────────────────────┐
│ 🔵 AI Suggestion       87% confident  X │
├─────────────────────────────────────────┤
│ Sure! My order number is #12345.       │
│ I placed it on December 20th and       │
│ haven't received any shipping updates  │
│ yet. Could you please help me track    │
│ it?                                     │
├─────────────────────────────────────────┤
│ Reasoning: Support agent requested     │
│ order number. Providing order details  │
│ and politely asking for help.          │
├─────────────────────────────────────────┤
│     [  Copy to Clipboard  ]             │
└─────────────────────────────────────────┘
```

#### Testing Checklist

- [ ] Extension loads without errors in `chrome://extensions`
- [ ] Service worker is active (shows as "service worker" link)
- [ ] Popup opens when clicking extension icon
- [ ] Test page loads and shows chat interface
- [ ] DevTools Console shows platform detection logs
- [ ] Clicking "Simulate Message" adds new support agent message to chat
- [ ] Suggestion panel appears after 0.5-1.5 seconds
- [ ] Suggestion content is relevant customer response to the support agent's message
- [ ] Confidence score displays (70-95%)
- [ ] "Copy to Clipboard" button copies text successfully
- [ ] Dismiss (X) button removes the panel
- [ ] Multiple messages trigger multiple suggestions
- [ ] No errors in console (red text)

#### Performance Metrics

Expected performance:
- **Suggestion latency:** 500-1500ms (mock API delay)
- **Extension memory:** < 50MB
- **DOM observation debounce:** 500ms
- **No memory leaks** after multiple interactions

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

## Common Issues & Troubleshooting

### Extension Won't Load

**Error: "Could not load manifest"**
- **Cause:** Missing or malformed `manifest.json`
- **Fix:** Run `npm run build` to regenerate the manifest
- **Check:** Verify `dist/manifest.json` exists and is valid JSON

**Error: "Could not load css 'src/content/styles.css'"**
- **Cause:** Manifest references non-existent CSS file
- **Fix:** This should be fixed in the latest build. Rebuild with `npm run build`
- **Manual fix:** Remove CSS reference from `public/manifest.json`

**Extension appears but shows errors:**
- Check the service worker console (`chrome://extensions` → "service worker")
- Look for missing dependencies or import errors
- Ensure all files in `dist/` were generated correctly

**Service Worker Shows "Inactive":**
- **Symptom:** Service worker link says "(Inactive)" and can't be clicked
- **Cause:** Chrome has issues with ES module imports in service workers
- **Fix:** Already implemented! We use a standalone bundled service worker
- **Verification:**
  1. Check `dist/service-worker.js` exists (not just `service-worker-loader.js`)
  2. Check `dist/manifest.json` has `"service_worker": "service-worker.js"` (no `"type": "module"`)
  3. Rebuild: `npm run build`
- **Build process:** The build automatically:
  - Copies standalone `public/service-worker.js` to `dist/`
  - Runs `fix-manifest.cjs` to set correct service worker reference
  - Ensures no ES module imports that Chrome can't resolve

### Extension Loads But Doesn't Work

**No suggestion panel appears:**
1. **Check the test page matches:**
   - Test page should have a chat-like structure
   - Must have elements with class `.chat-wrapper` or `[role="log"]`

2. **Check platform detection:**
   - Open DevTools Console
   - Look for: `[Platform] Detected: [platform-name]`
   - If you see "No chat interface detected", the DOM structure isn't recognized

3. **Check DOM observer:**
   - Look for: `[DOM Observer] Started observing...`
   - If missing, observer didn't initialize

4. **Check message detection:**
   - Click "Simulate Message" on test page
   - Should see: `[DOM Observer] Detected N new message(s)`

5. **Check API call:**
   - Should see: `[Background] Received message: GET_SUGGESTION`
   - Wait 0.5-1.5 seconds for mock API response

**Suggestion panel appears but looks broken:**
- Check for CSS loading issues
- Verify Tailwind CSS is compiled in `dist/assets/`
- Try hard refresh (Cmd+Shift+R)

**"Copy to Clipboard" doesn't work:**
- Check browser clipboard permissions
- Try on a non-file:// URL (some browsers restrict clipboard on file URLs)

### Content Script Not Injecting

**Symptoms:**
- No console logs from content script
- Extension works on test page but not real sites

**Fixes:**
1. **Check URL patterns in manifest:**
   ```json
   "matches": [
     "https://*.zendesk.com/*",
     "https://*.intercom.io/*"
   ]
   ```
   - Content script only runs on these domains
   - Add more domains as needed

2. **For testing on any page:**
   - The test page (`test-page.html`) works because it uses generic detection
   - For other sites, you may need to add the domain to `matches`

3. **Verify page is loaded:**
   - Content script runs at `document_end`
   - If DOM loads slowly, observer might miss elements
   - Check for errors in page console

### Performance Issues

**Extension is slow:**
- Check network throttling isn't enabled in DevTools
- Verify mock API delay (500-1500ms is expected)
- Look for memory leaks (check Chrome Task Manager)

**Browser freezes:**
- Possible infinite loop in DOM observer
- Check console for excessive logging
- Disable extension and reload page

### Build/Development Issues

**TypeScript errors:**
```bash
# Check for type errors
npm run type-check

# Common fixes:
npm install --save-dev @types/chrome
```

**Vite build fails:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Tests failing:**
```bash
# Run specific test file
npm test -- src/lib/debounce.test.ts

# Check mock setup
# Chrome APIs must be mocked in src/test/setup.ts
```

### API/Backend Issues

**Mock API not responding:**
- Mock API is built-in (no backend needed for Phase 1)
- Check `src/lib/mock-api.ts` for the implementation
- Should see API delay in console logs

**When real backend is connected:**
- Content scripts **CANNOT** make direct API calls (CORS)
- **MUST** route through service worker
- Update `src/background/api-client.ts` with real endpoint

### Getting Help

1. **Check console logs** in all contexts:
   - Service worker console
   - Page console (content script)
   - Popup console (if applicable)

2. **Enable verbose logging:**
   - Development mode shows debug logs
   - Look for `[DEBUG]` prefixed messages

3. **Common console patterns:**
   ```
   ✅ Working:
   [Content Script] Content script initializing...
   [Platform] Detected: generic
   [DOM Observer] Started observing...
   [Background] Received message: GET_SUGGESTION

   ❌ Not working:
   [Platform] No chat interface detected
   [DOM Observer] No chat container found
   Uncaught Error: ...
   ```

4. **Create a minimal reproduction:**
   - Use the included `test-page.html`
   - Simplify until you isolate the issue
   - Check if issue is platform-specific

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
