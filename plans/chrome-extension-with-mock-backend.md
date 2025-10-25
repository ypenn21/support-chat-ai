# Feature Implementation Plan: Chrome Extension with Mock Backend (Dual-Mode)

## 📋 Todo Checklist

### Phase 1: Core Infrastructure (Suggestion Mode Foundation)
- [ ] Implement Background Service Worker (message router, mock API client)
- [ ] Implement Content Scripts (DOM observer, context extractor, platform selectors)
- [ ] Create UI Injector Component (React suggestion panel)
- [ ] Add Chrome Storage Utilities
- [ ] Create Mock Backend Response Service (Suggestion Mode)
- [ ] Add Debouncing and Performance Optimizations
- [ ] Implement Error Handling and Logging
- [ ] Create Unit Tests for Core Functions

### Phase 2: YOLO Mode Components
- [ ] Implement Mode Controller (Background Worker)
- [ ] Implement Goal Tracker (Background Worker)
- [ ] Create Auto-Responder (Content Script)
- [ ] Create Safety Monitor (Content Script)
- [ ] Build Mock YOLO API Client (Autonomous Response)
- [ ] Build Mode Selector UI (Popup)
- [ ] Build Goal Configuration UI (Popup)
- [ ] Build Live Monitor Dashboard (Popup)
- [ ] Build Emergency Stop Button (Popup)
- [ ] Add YOLO Mode Options (Options Page)

### Phase 3: Integration & Testing
- [ ] Build Popup UI (Settings, Status, History - Suggestion Mode)
- [ ] Build Options Page (Advanced Settings, Platform Config)
- [ ] Create Shared UI Components (shadcn/ui)
- [ ] Add Extension Icons
- [ ] Create Unit Tests for YOLO Components
- [ ] Final Integration Testing and Manual Verification

## 🔍 Analysis & Investigation

### Codebase Structure

**Current State:**
The project has been initialized with:
- ✅ Extension directory structure created (`extension/src/`)
- ✅ TypeScript configuration (`tsconfig.json`, `tsconfig.node.json`)
- ✅ Vite + React + @crxjs/vite-plugin setup (`vite.config.ts`)
- ✅ Tailwind CSS configured (`tailwind.config.js`, `postcss.config.js`)
- ✅ Manifest V3 file (`public/manifest.json`)
- ✅ Type definitions (`src/types/index.ts`)
- ✅ Utilities (`src/lib/utils.ts`)
- ✅ Test setup (`src/test/setup.ts`)
- ✅ ESLint and Prettier configured

**Directories Created:**
- `src/background/` - Empty (for service worker)
- `src/content/` - Empty (for content scripts)
  - `src/content/platforms/` - Empty (for platform-specific selectors)
- `src/popup/` - Empty (for popup UI)
  - `src/popup/components/` - Empty (for popup components)
- `src/options/` - Empty (for options page)
- `src/components/ui/` - Empty (for shared shadcn components)
- `src/lib/` - Contains `utils.ts` (cn helper)
- `src/types/` - Contains complete TypeScript types
- `src/styles/` - Contains `globals.css` with Tailwind

**Missing Components:**
- Background service worker implementation
- Content script implementation
- Platform-specific DOM selectors
- React components (popup, options, UI injector)
- Chrome storage wrapper utilities
- Mock API client service (both modes)
- YOLO mode specific components

### Current Architecture

**Technology Stack:**
- **Runtime**: Chrome Extension Manifest V3
- **Language**: TypeScript 5.3
- **UI Framework**: React 18.2 with Vite 5.0
- **Build Tool**: @crxjs/vite-plugin 2.0.0-beta
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 4.4.7
- **API State**: @tanstack/react-query 5.17.9
- **Icons**: lucide-react 0.300.0
- **Testing**: Vitest 1.1.3 + React Testing Library 14.1.2

**Manifest V3 Configuration:**
- Permissions: `storage`, `activeTab`, `scripting`
- Host permissions: `https://*.zendesk.com/*`, `https://*.intercom.io/*`
- Service worker: `src/background/index.ts`
- Content scripts: `src/content/index.ts` (document_end)
- Popup: `src/popup/index.html`
- Options: `src/options/index.html`

**Dual-Mode Architecture:**
1. **Background Service Worker**:
   - Message routing
   - API calls (mocked for both modes)
   - State management
   - **Mode Controller** (switch between Suggestion/YOLO)
   - **Goal Tracker** (track YOLO goal progress)

2. **Content Scripts**:
   - DOM observation
   - Context extraction
   - UI injection (Suggestion panel)
   - **Auto-Responder** (YOLO mode: inject and send AI responses)
   - **Safety Monitor** (YOLO mode: detect escalation triggers)

3. **Popup/Options**:
   - **Mode Selector** (toggle between modes)
   - Settings and preferences
   - **Goal Configuration** (YOLO mode objectives)
   - **Live Monitor** (real-time YOLO conversation view)
   - **Emergency Stop** (immediately halt YOLO mode)

### Dual-Mode Operation

The extension operates in two distinct modes:

| Feature | Suggestion Mode | YOLO Mode |
|---------|-----------------|-----------|
| **Control** | Human decides when to send | AI sends automatically |
| **AI Role** | Suggests responses | Generates & sends responses |
| **Human Role** | Reviews and edits | Monitors and intervenes if needed |
| **Use Case** | Agent wants AI assistance | Agent wants full automation |
| **Safety** | Human review before sending | Multiple auto-escalation triggers |
| **Goal Tracking** | None | Goal-oriented conversation management |
| **Emergency Stop** | Not needed | Always available |

### Dependencies & Integration Points

**Chrome APIs to Use:**
- `chrome.runtime.sendMessage()` / `chrome.runtime.onMessage` - Message passing
- `chrome.storage.local` / `chrome.storage.sync` - Persistent storage
- `chrome.tabs` - Tab detection (optional)

**External Dependencies (Already Installed):**
- React 18.2 for UI components
- Zustand for global state management
- React Query for async state management
- Tailwind CSS for styling
- lucide-react for icons

**Mock Backend Integration:**
Since the backend is not yet deployed, we need to:
1. Create a mock API client for **Suggestion Mode** (`/api/suggest-response`)
2. Create a mock API client for **YOLO Mode** (`/api/autonomous-response`)
3. Match the response structure from `backend/app/models/response.py`
4. Simulate realistic latency (500-1500ms)
5. Provide sample suggestions/actions based on conversation context
6. Mock goal-oriented decision making (Respond/Escalate/Need-info/Done)

### Considerations & Challenges

**1. Manifest V3 Constraints:**
- ✅ Service workers cannot access DOM
- ✅ Content scripts cannot make direct external API calls (CORS)
- ✅ Must use `chrome.runtime.sendMessage()` for communication
- ✅ No localStorage in service worker context (use chrome.storage)

**2. DOM Observation:**
- Challenge: Different platforms have different HTML structures
- Solution: Create platform-specific selectors with fallbacks
- Challenge: MutationObserver can fire frequently
- Solution: Debounce to 500ms to prevent excessive processing

**3. Message Passing:**
- Challenge: Async responses require `return true` in listener
- Solution: Use proper async/await patterns in message handlers
- Challenge: Serialization limitations (no functions, DOM nodes)
- Solution: Extract plain data before sending messages

**4. React in Content Scripts:**
- Challenge: Injecting React components into arbitrary DOM
- Solution: Create isolated React root with Shadow DOM (optional)
- Challenge: Styling isolation
- Solution: Tailwind with scoped styles

**5. Mock Backend Responses:**
- Challenge: Need realistic suggestions for testing
- Solution: Create context-aware mock responses based on keywords
- Challenge: Simulate latency and confidence scores
- Solution: Random delays (500-1500ms) and confidence (0.7-0.95)
- **YOLO Mode Challenge**: Mock goal-oriented decision making
- **YOLO Mode Solution**: Simple rule-based system to decide Respond/Escalate based on keywords and turn count

**6. Platform Detection:**
- Challenge: Detecting Zendesk vs Intercom vs Generic
- Solution: Check URL hostname and DOM structure
- Challenge: Chat widgets may load dynamically
- Solution: Use setTimeout or DOM ready detection

**7. State Management:**
- Challenge: Sharing state between contexts
- Solution: Use chrome.storage for persistence, Zustand for popup state
- Challenge: Real-time updates (especially for YOLO mode)
- Solution: Storage change listeners + message broadcasting

**8. Performance:**
- Challenge: Memory leaks in long-running content scripts
- Solution: Cleanup observers on disconnect
- Challenge: Extension overhead
- Solution: Lazy loading, code splitting

**9. YOLO Mode Safety:**
- Challenge: Preventing runaway autonomous responses
- Solution: Multiple safety mechanisms (max turns, escalation triggers, emergency stop)
- Challenge: Real-time monitoring and intervention
- Solution: Live dashboard in popup with conversation preview
- Challenge: Ensuring proper escalation to humans
- Solution: Client-side and server-side escalation checks

**10. Auto-Sending Messages:**
- Challenge: Simulating user click on send button
- Solution: Programmatic click on detected send button element
- Challenge: Some platforms may have anti-automation
- Solution: Optional confirmation delay (preview before sending)

## 📝 Implementation Plan

### Prerequisites

Before starting implementation, ensure:
1. Extension dependencies are installed: `cd extension && npm install`
2. TypeScript is configured correctly
3. Vite dev server can start: `npm run dev`
4. Chrome browser is available for testing

### Step-by-Step Implementation

---

#### Step 1: Create Mock API Client Service (Both Modes)

**Files to create:**
- `extension/src/lib/mock-api.ts`

**Changes needed:**
- Create mock API client for **Suggestion Mode** that matches `/api/suggest-response`
- Create mock API client for **YOLO Mode** that matches `/api/autonomous-response`
- Generate realistic suggestions based on conversation context
- **YOLO Mode**: Mock goal-oriented decision making (Respond/Escalate/Need-info/Done)
- Simulate API latency (500-1500ms)
- Return responses matching `SuggestResponse` and `AutonomousResponse` types

**Implementation details:**
```typescript
// Mock Suggestion Mode response generator
export async function generateMockSuggestion(
  request: SuggestRequest
): Promise<SuggestResponse> {
  // Analyze last customer message
  // Return contextual suggestion
  // Add realistic latency
  await delay(randomLatency(500, 1500))
  return {
    suggestions: [{
      id: generateId(),
      content: generateContextualResponse(request.conversation_context),
      confidence: randomConfidence(0.7, 0.95),
      reasoning: "Based on customer's recent message..."
    }],
    metadata: {
      model_used: "gemini-1.5-pro-mock",
      latency: 1.2,
      token_count: 150
    }
  }
}

// Mock YOLO Mode response generator
export async function generateMockAutonomousResponse(
  request: AutonomousRequest
): Promise<AutonomousResponse> {
  // Analyze goal state and conversation
  // Decide: Respond, Escalate, Need-info, or Done
  const action = determineAction(request)
  await delay(randomLatency(500, 1500))

  if (action === 'escalate') {
    return {
      action: 'escalate',
      reason: 'Escalation keyword detected',
      goal_state: request.goal_state
    }
  }

  return {
    action: 'respond',
    response: {
      id: generateId(),
      content: generateGoalOrientedResponse(request),
      confidence: randomConfidence(0.75, 0.92)
    },
    goal_state: {
      ...request.goal_state,
      turns_taken: request.goal_state.turns_taken + 1,
      current_step: determineNextStep(request)
    },
    metadata: {
      model_used: "gemini-1.5-pro-mock",
      latency: 1.5
    }
  }
}

// Helper: Determine action based on rules
function determineAction(request: AutonomousRequest): Action {
  // Check escalation keywords
  const lastMessage = request.conversation_context[request.conversation_context.length - 1]
  const escalationKeywords = request.safety_constraints.escalation_keywords || []

  if (escalationKeywords.some(kw => lastMessage.content.toLowerCase().includes(kw))) {
    return 'escalate'
  }

  // Check max turns
  if (request.goal_state.turns_taken >= request.safety_constraints.max_turns) {
    return 'escalate'
  }

  // Check if goal is complete (simple heuristic)
  if (request.goal_state.info_gathered?.length >= 3) {
    return 'goal_complete'
  }

  return 'respond'
}
```

---

#### Step 2: Create Chrome Storage Wrapper

**Files to create:**
- `extension/src/lib/storage.ts`

**Changes needed:**
- Wrap `chrome.storage.local` and `chrome.storage.sync` APIs
- Type-safe storage access using `StorageData` interface
- Helper functions: `getPreferences()`, `savePreferences()`, `getApiKey()`, etc.
- **YOLO Mode**: Add storage for current mode, goal state, conversation logs
- Storage change listeners

**Implementation details:**
```typescript
export interface StorageData {
  preferences: UserPreferences
  apiKey?: string
  mode: 'suggestion' | 'yolo'
  yoloState?: YoloState
  conversationLogs?: ConversationLog[]
}

export interface YoloState {
  active: boolean
  goal: Goal
  goalState: GoalState
  safetyConstraints: SafetyConstraints
  conversationId: string
}

export async function getMode(): Promise<'suggestion' | 'yolo'>
export async function setMode(mode: 'suggestion' | 'yolo'): Promise<void>
export async function getYoloState(): Promise<YoloState | null>
export async function saveYoloState(state: YoloState): Promise<void>
export async function clearYoloState(): Promise<void>
export async function getPreferences(): Promise<UserPreferences | null>
export async function savePreferences(prefs: UserPreferences): Promise<void>
export function onModeChange(callback: (mode: 'suggestion' | 'yolo') => void)
export function onYoloStateChange(callback: (state: YoloState | null) => void)
```

---

#### Step 3: Implement Platform Detection Utilities

**Files to create:**
- `extension/src/content/platforms/zendesk.ts`
- `extension/src/content/platforms/intercom.ts`
- `extension/src/content/platforms/generic.ts`
- `extension/src/content/platforms/index.ts`

**Changes needed:**
- Zendesk: Detect chat widget, extract message selectors
- Intercom: Detect Intercom widget, handle Shadow DOM
- Generic: Fallback selectors using ARIA roles
- Platform detector: Auto-detect platform based on URL/DOM
- **YOLO Mode**: Add `getSendButton()` method for auto-sending

**Implementation details:**
```typescript
export interface PlatformDetector {
  detect(): boolean
  getChatContainer(): HTMLElement | null
  getMessageElements(): HTMLElement[]
  getMessageText(element: HTMLElement): string
  getMessageRole(element: HTMLElement): 'agent' | 'customer'
  getInputBox(): HTMLElement | null
  getSendButton(): HTMLElement | null // For YOLO mode auto-send
}

// zendesk.ts
export const zendeskDetector: PlatformDetector = {
  detect: () => window.location.hostname.includes('zendesk.com'),
  getChatContainer: () => document.querySelector('.chat-wrapper'),
  getInputBox: () => document.querySelector('.chat-input'),
  getSendButton: () => document.querySelector('.chat-send-button'),
  // ... other methods
}
```

---

#### Step 4: Implement Context Extractor

**Files to create:**
- `extension/src/content/context-extractor.ts`

**Changes needed:**
- Extract conversation context from DOM
- Parse messages into `Message[]` format
- Get timestamps (use Date.now() if not available)
- Determine message role (agent vs customer)
- Limit to last 10 messages for context

**Implementation details:**
```typescript
export function extractConversationContext(
  platform: PlatformDetector
): Message[] {
  const messageElements = platform.getMessageElements()
  const messages: Message[] = []

  // Take last 10 messages
  const recentMessages = messageElements.slice(-10)

  for (const element of recentMessages) {
    messages.push({
      role: platform.getMessageRole(element),
      content: platform.getMessageText(element),
      timestamp: Date.now() // Fallback if not available
    })
  }

  return messages
}
```

---

#### Step 5: Implement DOM Observer

**Files to create:**
- `extension/src/content/dom-observer.ts`

**Changes needed:**
- Create MutationObserver for chat container
- Debounce mutations to 500ms
- Detect new customer messages
- Trigger suggestion request via message passing
- **YOLO Mode**: Trigger autonomous response
- Cleanup on disconnect

**Implementation details:**
```typescript
export function createChatObserver(
  container: HTMLElement,
  onNewMessage: (messages: Message[]) => void,
  mode: 'suggestion' | 'yolo'
): () => void {
  let previousMessageCount = 0

  const handleMutation = debounce(() => {
    const messages = container.querySelectorAll('.message')

    // Detect new messages
    if (messages.length > previousMessageCount) {
      const lastMessage = messages[messages.length - 1]
      const role = detectRole(lastMessage)

      // In YOLO mode, only trigger on customer messages
      // In Suggestion mode, trigger on all new messages
      if (mode === 'yolo' && role === 'customer') {
        onNewMessage(extractAllMessages(messages))
      } else if (mode === 'suggestion') {
        onNewMessage(extractAllMessages(messages))
      }

      previousMessageCount = messages.length
    }
  }, 500)

  const observer = new MutationObserver(handleMutation)
  observer.observe(container, { childList: true, subtree: true })

  return () => observer.disconnect()
}
```

---

#### Step 6: Implement Background Service Worker (Core)

**Files to create:**
- `extension/src/background/index.ts`
- `extension/src/background/message-router.ts`
- `extension/src/background/api-client.ts`

**Changes needed:**
- Set up message listener using `chrome.runtime.onMessage`
- Route messages: `GET_SUGGESTION`, `GET_AUTONOMOUS_RESPONSE`, `SAVE_PREFERENCES`, `GET_PREFERENCES`
- Call mock API client for suggestions (both modes)
- Return responses to content script
- Handle errors gracefully

**Implementation details:**
```typescript
// background/index.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SUGGESTION') {
    handleGetSuggestion(message.payload)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }))
    return true // Required for async
  }

  if (message.type === 'GET_AUTONOMOUS_RESPONSE') {
    handleGetAutonomousResponse(message.payload)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }))
    return true
  }

  if (message.type === 'SET_MODE') {
    handleSetMode(message.payload)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }))
    return true
  }

  if (message.type === 'EMERGENCY_STOP') {
    handleEmergencyStop()
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }))
    return true
  }
})

// background/api-client.ts
export async function getSuggestion(request: SuggestRequest): Promise<SuggestResponse> {
  // Call mock API (Suggestion Mode)
  return generateMockSuggestion(request)
}

export async function getAutonomousResponse(request: AutonomousRequest): Promise<AutonomousResponse> {
  // Call mock API (YOLO Mode)
  return generateMockAutonomousResponse(request)
}
```

---

#### Step 7: Implement Mode Controller (Background Worker)

**Files to create:**
- `extension/src/background/mode-controller.ts`

**Changes needed:**
- Manage mode switching (Suggestion ↔ YOLO)
- Validate mode transitions
- Notify all contexts (content scripts, popup) of mode changes
- Store mode in chrome.storage
- Handle emergency stop

**Implementation details:**
```typescript
export class ModeController {
  private currentMode: 'suggestion' | 'yolo' = 'suggestion'

  async initialize() {
    const mode = await getMode()
    this.currentMode = mode || 'suggestion'
  }

  async switchMode(newMode: 'suggestion' | 'yolo'): Promise<void> {
    if (newMode === 'yolo') {
      // Validate YOLO mode can be activated
      const yoloState = await getYoloState()
      if (!yoloState || !yoloState.goal) {
        throw new Error('Cannot activate YOLO mode without a goal')
      }
    }

    this.currentMode = newMode
    await setMode(newMode)

    // Broadcast mode change to all contexts
    this.broadcastModeChange(newMode)
  }

  async emergencyStop(): Promise<void> {
    if (this.currentMode === 'yolo') {
      await this.switchMode('suggestion')
      await clearYoloState()

      // Notify user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'YOLO Mode Stopped',
        message: 'Autonomous mode has been stopped. Returning to manual control.'
      })
    }
  }

  private broadcastModeChange(mode: 'suggestion' | 'yolo') {
    // Send message to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'MODE_CHANGED',
            payload: { mode }
          })
        }
      })
    })
  }

  getCurrentMode(): 'suggestion' | 'yolo' {
    return this.currentMode
  }
}

export const modeController = new ModeController()
```

---

#### Step 8: Implement Goal Tracker (Background Worker)

**Files to create:**
- `extension/src/background/goal-tracker.ts`

**Changes needed:**
- Track goal progress (turns taken, info gathered, current step)
- Update goal state after each autonomous response
- Detect goal completion
- Store goal state in chrome.storage
- Provide goal state to content script and popup

**Implementation details:**
```typescript
export interface GoalState {
  turns_taken: number
  info_gathered: string[]
  current_step: string
  started_at: number
  last_updated: number
}

export interface Goal {
  type: 'resolve_issue' | 'gather_info' | 'escalate' | 'custom'
  description: string
  required_info?: string[]
  max_turns: number
}

export class GoalTracker {
  private currentGoal: Goal | null = null
  private currentState: GoalState | null = null

  async initialize() {
    const yoloState = await getYoloState()
    if (yoloState) {
      this.currentGoal = yoloState.goal
      this.currentState = yoloState.goalState
    }
  }

  async setGoal(goal: Goal): Promise<void> {
    this.currentGoal = goal
    this.currentState = {
      turns_taken: 0,
      info_gathered: [],
      current_step: 'initializing',
      started_at: Date.now(),
      last_updated: Date.now()
    }

    await this.saveState()
  }

  async updateState(newState: Partial<GoalState>): Promise<void> {
    if (!this.currentState) return

    this.currentState = {
      ...this.currentState,
      ...newState,
      last_updated: Date.now()
    }

    await this.saveState()
  }

  async incrementTurn(): Promise<void> {
    if (!this.currentState) return

    this.currentState.turns_taken += 1
    this.currentState.last_updated = Date.now()

    await this.saveState()
  }

  isGoalComplete(): boolean {
    if (!this.currentGoal || !this.currentState) return false

    // Simple heuristic: goal is complete if all required info gathered
    if (this.currentGoal.required_info) {
      return this.currentGoal.required_info.every(info =>
        this.currentState!.info_gathered.includes(info)
      )
    }

    return false
  }

  hasReachedMaxTurns(): boolean {
    if (!this.currentGoal || !this.currentState) return false
    return this.currentState.turns_taken >= this.currentGoal.max_turns
  }

  getProgress(): number {
    if (!this.currentGoal || !this.currentState) return 0

    if (this.currentGoal.required_info) {
      return (this.currentState.info_gathered.length / this.currentGoal.required_info.length) * 100
    }

    return (this.currentState.turns_taken / this.currentGoal.max_turns) * 100
  }

  private async saveState() {
    if (!this.currentGoal || !this.currentState) return

    await saveYoloState({
      active: true,
      goal: this.currentGoal,
      goalState: this.currentState,
      safetyConstraints: await this.getSafetyConstraints(),
      conversationId: generateId()
    })
  }

  private async getSafetyConstraints(): Promise<SafetyConstraints> {
    // Get from storage or use defaults
    return {
      max_turns: this.currentGoal?.max_turns || 10,
      escalation_keywords: ['angry', 'manager', 'complaint', 'supervisor'],
      stop_if_confused: true
    }
  }

  async clear(): Promise<void> {
    this.currentGoal = null
    this.currentState = null
    await clearYoloState()
  }

  getState(): { goal: Goal | null; state: GoalState | null } {
    return {
      goal: this.currentGoal,
      state: this.currentState
    }
  }
}

export const goalTracker = new GoalTracker()
```

---

#### Step 9: Create Auto-Responder (Content Script)

**Files to create:**
- `extension/src/content/auto-responder.ts`

**Changes needed:**
- Inject AI response into chat input box
- Programmatically click send button
- Optional preview delay (configurable)
- Handle different platform input methods
- Clear input after sending

**Implementation details:**
```typescript
export class AutoResponder {
  private platform: PlatformDetector
  private previewDelay: number // milliseconds

  constructor(platform: PlatformDetector, previewDelay = 3000) {
    this.platform = platform
    this.previewDelay = previewDelay
  }

  async sendResponse(content: string, preview = true): Promise<void> {
    const inputBox = this.platform.getInputBox()
    const sendButton = this.platform.getSendButton()

    if (!inputBox || !sendButton) {
      throw new Error('Cannot find input box or send button')
    }

    // Inject response into input
    this.setInputValue(inputBox, content)

    // Optional preview delay
    if (preview && this.previewDelay > 0) {
      await this.showPreview(content)
      await delay(this.previewDelay)
    }

    // Click send button
    this.clickSend(sendButton)
  }

  private setInputValue(inputBox: HTMLElement, value: string) {
    if (inputBox instanceof HTMLInputElement || inputBox instanceof HTMLTextAreaElement) {
      inputBox.value = value
      inputBox.dispatchEvent(new Event('input', { bubbles: true }))
      inputBox.dispatchEvent(new Event('change', { bubbles: true }))
    } else {
      // ContentEditable div
      inputBox.textContent = value
      inputBox.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  private clickSend(sendButton: HTMLElement) {
    sendButton.click()
  }

  private async showPreview(content: string) {
    // Show floating preview notification
    const preview = document.createElement('div')
    preview.className = 'support-ai-preview'
    preview.textContent = `Sending in ${this.previewDelay / 1000}s: "${content.substring(0, 50)}..."`
    document.body.appendChild(preview)

    setTimeout(() => preview.remove(), this.previewDelay)
  }
}
```

---

#### Step 10: Create Safety Monitor (Content Script)

**Files to create:**
- `extension/src/content/safety-monitor.ts`

**Changes needed:**
- Detect escalation keywords in customer messages
- Analyze sentiment (simple keyword-based for MVP)
- Detect confusion (repeated questions)
- Check confidence thresholds
- Trigger emergency stop if needed

**Implementation details:**
```typescript
export interface SafetyCheck {
  shouldEscalate: boolean
  reason?: string
  triggers: string[]
}

export class SafetyMonitor {
  private escalationKeywords: string[]
  private minConfidence: number
  private maxTurns: number

  constructor(constraints: SafetyConstraints) {
    this.escalationKeywords = constraints.escalation_keywords || []
    this.minConfidence = 0.7
    this.maxTurns = constraints.max_turns || 10
  }

  checkMessage(message: Message, goalState: GoalState): SafetyCheck {
    const triggers: string[] = []

    // Check for escalation keywords
    const hasEscalationKeyword = this.escalationKeywords.some(keyword => {
      const found = message.content.toLowerCase().includes(keyword.toLowerCase())
      if (found) triggers.push(`keyword: ${keyword}`)
      return found
    })

    if (hasEscalationKeyword) {
      return {
        shouldEscalate: true,
        reason: 'Escalation keyword detected',
        triggers
      }
    }

    // Check for max turns
    if (goalState.turns_taken >= this.maxTurns) {
      triggers.push('max turns reached')
      return {
        shouldEscalate: true,
        reason: 'Maximum conversation turns reached',
        triggers
      }
    }

    // Check for repeated questions (simple heuristic)
    // This would need conversation history to implement properly

    return {
      shouldEscalate: false,
      triggers
    }
  }

  checkConfidence(confidence: number): boolean {
    return confidence >= this.minConfidence
  }

  analyzeSentiment(message: Message): 'positive' | 'neutral' | 'negative' {
    // Simple keyword-based sentiment analysis for MVP
    const negativeWords = ['angry', 'frustrated', 'terrible', 'awful', 'hate']
    const positiveWords = ['thanks', 'great', 'helpful', 'appreciate']

    const content = message.content.toLowerCase()

    const hasNegative = negativeWords.some(word => content.includes(word))
    const hasPositive = positiveWords.some(word => content.includes(word))

    if (hasNegative && !hasPositive) return 'negative'
    if (hasPositive && !hasNegative) return 'positive'
    return 'neutral'
  }
}
```

---

#### Step 11: Create UI Injector (React Component for Suggestion Mode)

**Files to create:**
- `extension/src/content/ui-injector.tsx`
- `extension/src/content/components/SuggestionPanel.tsx`
- `extension/src/content/components/SuggestionCard.tsx`

**Changes needed:**
- Create React root in content script
- Build floating suggestion panel component
- Display suggestions with copy button
- Show loading state
- Handle errors
- Style with Tailwind (ensure isolation)

**Implementation details:**
```typescript
// ui-injector.tsx
export function mountSuggestionPanel(
  suggestion: Suggestion,
  onCopy: () => void
): () => void {
  const container = document.createElement('div')
  container.id = 'support-ai-suggestion-panel'
  container.style.position = 'fixed'
  container.style.zIndex = '10000'
  document.body.appendChild(container)

  const root = createRoot(container)
  root.render(<SuggestionPanel suggestion={suggestion} onCopy={onCopy} />)

  return () => {
    root.unmount()
    container.remove()
  }
}

// SuggestionPanel.tsx
export function SuggestionPanel({
  suggestion,
  isLoading,
  error
}: Props) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 max-w-md">
      {isLoading && <div>Loading suggestion...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {suggestion && (
        <SuggestionCard
          content={suggestion.content}
          confidence={suggestion.confidence}
          onCopy={() => navigator.clipboard.writeText(suggestion.content)}
        />
      )}
    </div>
  )
}
```

---

#### Step 12: Implement Content Script Entry Point (Dual-Mode)

**Files to create:**
- `extension/src/content/index.ts`
- `extension/src/content/styles.css`

**Changes needed:**
- Detect platform on page load
- Initialize DOM observer
- Listen for new messages
- **Mode-aware behavior**:
  - **Suggestion Mode**: Request suggestions, mount UI panel
  - **YOLO Mode**: Request autonomous response, auto-send
- Handle mode changes
- Add basic CSS for suggestion panel

**Implementation details:**
```typescript
// content/index.ts
let currentMode: 'suggestion' | 'yolo' = 'suggestion'
let autoResponder: AutoResponder | null = null
let safetyMonitor: SafetyMonitor | null = null
let cleanup: (() => void) | null = null

async function init() {
  const platform = detectPlatform()
  if (!platform) return

  const container = platform.getChatContainer()
  if (!container) return

  // Load current mode
  currentMode = await getMode()

  // Initialize YOLO components if in YOLO mode
  if (currentMode === 'yolo') {
    const yoloState = await getYoloState()
    if (yoloState) {
      autoResponder = new AutoResponder(platform, 3000)
      safetyMonitor = new SafetyMonitor(yoloState.safetyConstraints)
    }
  }

  // Start observing
  cleanup = createChatObserver(container, handleNewMessages, currentMode)
}

async function handleNewMessages(messages: Message[]) {
  if (currentMode === 'suggestion') {
    await handleSuggestionMode(messages)
  } else if (currentMode === 'yolo') {
    await handleYoloMode(messages)
  }
}

async function handleSuggestionMode(messages: Message[]) {
  const context = messages.slice(-10)

  // Request suggestion
  const response = await chrome.runtime.sendMessage({
    type: 'GET_SUGGESTION',
    payload: {
      platform: detectPlatformType(),
      conversation_context: context,
      mode: 'suggestion'
    }
  })

  if (response.error) {
    console.error('Suggestion error:', response.error)
    return
  }

  // Mount suggestion panel
  const suggestion = response.suggestions[0]
  mountSuggestionPanel(suggestion, () => {
    navigator.clipboard.writeText(suggestion.content)
  })
}

async function handleYoloMode(messages: Message[]) {
  if (!autoResponder || !safetyMonitor) return

  const lastMessage = messages[messages.length - 1]

  // Only proceed if last message is from customer
  if (lastMessage.role !== 'customer') return

  // Get current goal state
  const yoloState = await getYoloState()
  if (!yoloState) return

  // Client-side safety check
  const safetyCheck = safetyMonitor.checkMessage(lastMessage, yoloState.goalState)
  if (safetyCheck.shouldEscalate) {
    await escalateToHuman(safetyCheck.reason)
    return
  }

  // Request autonomous response
  const response = await chrome.runtime.sendMessage({
    type: 'GET_AUTONOMOUS_RESPONSE',
    payload: {
      platform: detectPlatformType(),
      conversation_context: messages.slice(-10),
      goal: yoloState.goal.type,
      goal_state: yoloState.goalState,
      safety_constraints: yoloState.safetyConstraints
    }
  })

  if (response.error) {
    console.error('Autonomous response error:', response.error)
    await escalateToHuman('API error')
    return
  }

  // Handle different actions
  if (response.action === 'escalate') {
    await escalateToHuman(response.reason)
    return
  }

  if (response.action === 'goal_complete') {
    await notifyGoalComplete()
    return
  }

  if (response.action === 'respond') {
    // Check confidence
    if (!safetyMonitor.checkConfidence(response.response.confidence)) {
      await escalateToHuman('Low confidence')
      return
    }

    // Auto-send response
    try {
      await autoResponder.sendResponse(response.response.content, true)

      // Update goal state in background
      await chrome.runtime.sendMessage({
        type: 'UPDATE_GOAL_STATE',
        payload: response.goal_state
      })
    } catch (error) {
      console.error('Failed to send response:', error)
      await escalateToHuman('Failed to send message')
    }
  }
}

async function escalateToHuman(reason: string) {
  // Switch back to suggestion mode
  await chrome.runtime.sendMessage({
    type: 'EMERGENCY_STOP',
    payload: { reason }
  })

  // Show notification
  showNotification('YOLO Mode Stopped', `Escalating to human: ${reason}`)
}

async function notifyGoalComplete() {
  showNotification('Goal Complete', 'Conversation goal has been achieved!')

  // Optionally switch back to suggestion mode
  await chrome.runtime.sendMessage({
    type: 'SET_MODE',
    payload: { mode: 'suggestion' }
  })
}

// Listen for mode changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'MODE_CHANGED') {
    currentMode = message.payload.mode

    // Reinitialize with new mode
    if (cleanup) cleanup()
    init()
  }
})

init()
```

---

#### Step 13: Build Mode Selector UI (Popup)

**Files to create:**
- `extension/src/popup/components/ModeSelector.tsx`

**Changes needed:**
- Toggle between Suggestion and YOLO modes
- Show current mode status
- Disable YOLO mode if no goal configured
- Visual indicator for active mode

**Implementation details:**
```tsx
export function ModeSelector() {
  const [mode, setMode] = useState<'suggestion' | 'yolo'>('suggestion')
  const [yoloState, setYoloState] = useState<YoloState | null>(null)

  useEffect(() => {
    // Load current mode
    getMode().then(setMode)
    getYoloState().then(setYoloState)

    // Listen for changes
    onModeChange(setMode)
    onYoloStateChange(setYoloState)
  }, [])

  const handleModeChange = async (newMode: 'suggestion' | 'yolo') => {
    if (newMode === 'yolo' && !yoloState?.goal) {
      alert('Please configure a goal before activating YOLO mode')
      return
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'SET_MODE',
        payload: { mode: newMode }
      })
      setMode(newMode)
    } catch (error) {
      console.error('Failed to change mode:', error)
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Mode</h3>
      <div className="flex gap-2">
        <button
          className={`flex-1 py-2 px-4 rounded ${
            mode === 'suggestion'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
          onClick={() => handleModeChange('suggestion')}
        >
          Suggestion Mode
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded ${
            mode === 'yolo'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200'
          }`}
          onClick={() => handleModeChange('yolo')}
          disabled={!yoloState?.goal}
        >
          YOLO Mode
          {mode === 'yolo' && ' 🤖'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {mode === 'suggestion'
          ? 'AI suggests responses for you to review'
          : 'AI automatically responds to customers'}
      </p>
    </div>
  )
}
```

---

#### Step 14: Build Goal Configuration UI (Popup)

**Files to create:**
- `extension/src/popup/components/GoalConfig.tsx`

**Changes needed:**
- Select goal type (Resolve issue, Gather info, etc.)
- Set goal description
- Configure safety constraints (max turns, keywords)
- Save goal configuration
- Show current goal if active

**Implementation details:**
```tsx
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
          <label className="block text-sm font-medium mb-1">Goal Type</label>
          <select
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
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="e.g., Resolve shipping delay issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Turns</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            min={1}
            max={20}
            value={maxTurns}
            onChange={(e) => setMaxTurns(parseInt(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Escalation Keywords (comma-separated)
          </label>
          <input
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
```

---

#### Step 15: Build Live Monitor Dashboard (Popup)

**Files to create:**
- `extension/src/popup/components/LiveMonitor.tsx`

**Changes needed:**
- Show real-time conversation preview
- Display goal progress (turns, confidence, info gathered)
- Show safety status (no escalation triggers, sentiment OK)
- Manual takeover button
- Only visible in YOLO mode

**Implementation details:**
```tsx
export function LiveMonitor() {
  const [yoloState, setYoloState] = useState<YoloState | null>(null)
  const [mode, setMode] = useState<'suggestion' | 'yolo'>('suggestion')
  const [conversation, setConversation] = useState<Message[]>([])

  useEffect(() => {
    getMode().then(setMode)
    getYoloState().then(setYoloState)

    onModeChange(setMode)
    onYoloStateChange(setYoloState)

    // Listen for conversation updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'CONVERSATION_UPDATE') {
        setConversation(message.payload.messages)
      }
    })
  }, [])

  if (mode !== 'yolo' || !yoloState) {
    return null
  }

  const progress = (yoloState.goalState.turns_taken / yoloState.goal.max_turns) * 100

  return (
    <div className="border rounded-lg p-4 bg-orange-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">🤖 YOLO Mode Active</h3>
        <button
          className="text-sm bg-red-500 text-white px-3 py-1 rounded"
          onClick={() => {
            chrome.runtime.sendMessage({ type: 'EMERGENCY_STOP' })
          }}
        >
          🛑 Emergency Stop
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-sm font-medium">Goal</div>
          <div className="text-sm text-gray-700">{yoloState.goal.description}</div>
        </div>

        <div>
          <div className="text-sm font-medium">Progress</div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-orange-500 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {yoloState.goalState.turns_taken} / {yoloState.goal.max_turns} turns
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Info Gathered</div>
          <div className="flex flex-wrap gap-1">
            {yoloState.goalState.info_gathered.map((info, i) => (
              <span key={i} className="text-xs bg-green-100 px-2 py-1 rounded">
                ✓ {info}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Recent Messages</div>
          <div className="max-h-32 overflow-y-auto text-xs space-y-1">
            {conversation.slice(-5).map((msg, i) => (
              <div key={i} className={msg.role === 'customer' ? 'text-blue-700' : 'text-gray-700'}>
                <strong>{msg.role === 'customer' ? '👤' : '🤖'}:</strong> {msg.content.substring(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

#### Step 16: Build Emergency Stop Button (Popup)

**Files to create:**
- `extension/src/popup/components/EmergencyStop.tsx`

**Changes needed:**
- Large, prominent stop button
- Immediately halt YOLO mode
- Switch back to suggestion mode
- Clear YOLO state
- Show confirmation

**Implementation details:**
```tsx
export function EmergencyStop() {
  const [mode, setMode] = useState<'suggestion' | 'yolo'>('suggestion')

  useEffect(() => {
    getMode().then(setMode)
    onModeChange(setMode)
  }, [])

  const handleEmergencyStop = async () => {
    if (confirm('Are you sure you want to stop YOLO mode and take manual control?')) {
      await chrome.runtime.sendMessage({ type: 'EMERGENCY_STOP' })
      setMode('suggestion')
    }
  }

  if (mode !== 'yolo') {
    return null
  }

  return (
    <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
      <button
        className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 text-lg"
        onClick={handleEmergencyStop}
      >
        🛑 EMERGENCY STOP
      </button>
      <p className="text-xs text-center text-gray-600 mt-2">
        Immediately halt autonomous mode and return to manual control
      </p>
    </div>
  )
}
```

---

#### Step 17: Build Popup UI Components (Combined)

**Files to create:**
- `extension/src/popup/index.html`
- `extension/src/popup/index.tsx`
- `extension/src/popup/App.tsx`
- `extension/src/popup/components/Settings.tsx`
- `extension/src/popup/components/Status.tsx`
- `extension/src/popup/components/History.tsx` (optional)

**Changes needed:**
- Create popup HTML entry point
- Build React app for popup
- Integrate all YOLO and Suggestion mode components
- Settings component: Enable/disable, tone, length preferences
- Status component: Show connection status, last suggestion time
- Use Zustand for popup state
- Save preferences to chrome.storage

**Implementation details:**
```tsx
// popup/App.tsx
export default function App() {
  return (
    <div className="w-96 p-4 max-h-[600px] overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Support Chat AI Assistant</h1>
      </div>

      <div className="space-y-4">
        <ModeSelector />
        <GoalConfig />
        <LiveMonitor />
        <EmergencyStop />
        <Status />
        <Settings />
        <History />
      </div>
    </div>
  )
}

// popup/components/Settings.tsx
export function Settings() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    tone: 'empathetic',
    length: 'medium',
    include_greeting: false
  })

  useEffect(() => {
    getPreferences().then(p => p && setPrefs(p))
  }, [])

  const handleSave = async () => {
    await savePreferences(prefs)
    alert('Preferences saved!')
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Settings</h3>
      <form className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Tone</label>
          <select
            className="w-full border rounded p-2"
            value={prefs.tone}
            onChange={(e) => setPrefs({ ...prefs, tone: e.target.value as any })}
          >
            <option value="professional">Professional</option>
            <option value="empathetic">Empathetic</option>
            <option value="casual">Casual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Length</label>
          <select
            className="w-full border rounded p-2"
            value={prefs.length}
            onChange={(e) => setPrefs({ ...prefs, length: e.target.value as any })}
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="greeting"
            checked={prefs.include_greeting}
            onChange={(e) => setPrefs({ ...prefs, include_greeting: e.target.checked })}
          />
          <label htmlFor="greeting" className="ml-2 text-sm">Include greeting</label>
        </div>

        <button
          type="button"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          onClick={handleSave}
        >
          Save Settings
        </button>
      </form>
    </div>
  )
}

// popup/components/Status.tsx
export function Status() {
  const [mode, setMode] = useState<'suggestion' | 'yolo'>('suggestion')
  const [lastActivity, setLastActivity] = useState<string>('Never')

  useEffect(() => {
    getMode().then(setMode)
    // Load last activity timestamp
  }, [])

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Status</h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Current Mode:</span>
          <span className="font-medium">
            {mode === 'suggestion' ? '📝 Suggestion' : '🤖 YOLO'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last Activity:</span>
          <span>{lastActivity}</span>
        </div>
        <div className="flex justify-between">
          <span>Connection:</span>
          <span className="text-green-600">● Online</span>
        </div>
      </div>
    </div>
  )
}
```

---

#### Step 18: Build Options Page Components (with YOLO Configuration)

**Files to create:**
- `extension/src/options/index.html`
- `extension/src/options/index.tsx`
- `extension/src/options/App.tsx`
- `extension/src/options/components/YoloModeOptions.tsx`

**Changes needed:**
- Create options HTML entry point
- Build React app for options
- Advanced settings (similar to popup but more detailed)
- YOLO Mode configuration section:
  - Goal presets (library of predefined goals)
  - Safety rules customization
  - Response constraints (tone, style for autonomous responses)
- Platform-specific configuration
- Export/import preferences

**Implementation details:**
```tsx
// options/App.tsx
export default function App() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        Support Chat AI Assistant - Settings
      </h1>

      <div className="space-y-6">
        <AdvancedSettings />
        <YoloModeOptions />
        <PlatformConfiguration />
      </div>
    </div>
  )
}

// options/components/YoloModeOptions.tsx
export function YoloModeOptions() {
  const goalPresets: Goal[] = [
    {
      type: 'resolve_issue',
      description: 'Resolve customer shipping delay',
      required_info: ['order_number', 'tracking_id', 'expected_delivery'],
      max_turns: 10
    },
    {
      type: 'gather_info',
      description: 'Gather customer information for support ticket',
      required_info: ['name', 'email', 'issue_description'],
      max_turns: 5
    },
    {
      type: 'escalate',
      description: 'Gather info and escalate to specialist',
      required_info: ['issue_category', 'urgency', 'account_id'],
      max_turns: 3
    }
  ]

  const handleSelectPreset = async (goal: Goal) => {
    await chrome.runtime.sendMessage({
      type: 'SET_GOAL',
      payload: {
        goal,
        constraints: {
          max_turns: goal.max_turns,
          escalation_keywords: ['angry', 'manager', 'complaint'],
          stop_if_confused: true
        }
      }
    })
    alert('Goal preset loaded!')
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">YOLO Mode Configuration</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Goal Presets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goalPresets.map((preset, i) => (
              <div key={i} className="border rounded p-3">
                <div className="font-medium">{preset.description}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Max turns: {preset.max_turns}
                </div>
                {preset.required_info && (
                  <div className="text-xs text-gray-500 mt-1">
                    Required: {preset.required_info.join(', ')}
                  </div>
                )}
                <button
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => handleSelectPreset(preset)}
                >
                  Load Preset
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Safety Rules</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-sm">Default Max Turns</label>
              <input type="number" className="border rounded p-2 w-32" defaultValue={10} />
            </div>
            <div>
              <label className="block text-sm">Preview Delay (seconds)</label>
              <input type="number" className="border rounded p-2 w-32" defaultValue={3} />
            </div>
            <div>
              <label className="block text-sm">Minimum Confidence Threshold</label>
              <input type="number" step="0.1" className="border rounded p-2 w-32" defaultValue={0.7} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

#### Step 19: Create Shared UI Components (shadcn/ui)

**Files to create:**
- `extension/src/components/ui/button.tsx`
- `extension/src/components/ui/card.tsx`
- `extension/src/components/ui/select.tsx`
- `extension/src/components/ui/switch.tsx`
- `extension/src/components/ui/badge.tsx`
- `extension/src/components/ui/progress.tsx` (for YOLO goal progress)

**Changes needed:**
- Install shadcn/ui components as needed
- Create basic button component with variants
- Create card component for suggestion display
- Create select component for preferences
- Create switch component for toggles
- Create badge component for confidence indicators
- **YOLO Mode**: Create progress component for goal tracking

**Implementation details:**
Use shadcn/ui CLI or manual installation:
```bash
# Manual installation approach
# Copy component code from https://ui.shadcn.com/
```

---

#### Step 20: Add Debouncing Utility

**Files to create:**
- `extension/src/lib/debounce.ts`

**Changes needed:**
- Create debounce function for DOM observer
- Type-safe implementation
- Configurable delay (default 500ms)

**Implementation details:**
```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
```

---

#### Step 21: Add Error Handling and Logging

**Files to create:**
- `extension/src/lib/logger.ts`
- `extension/src/lib/error-handler.ts`

**Changes needed:**
- Create logger utility with levels (debug, info, warn, error)
- Respect debug mode from environment/settings
- Create error boundary for React components
- Global error handler for uncaught errors
- **YOLO Mode**: Log autonomous actions for audit trail

**Implementation details:**
```typescript
// logger.ts
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) console.log(`[DEBUG]`, message, ...args)
  },
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO]`, message, ...args)
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN]`, message, ...args)
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR]`, message, error)
  },
  yolo: (action: string, details: any) => {
    // Special log for YOLO mode actions (audit trail)
    console.log(`[YOLO]`, action, details)
  }
}
```

---

#### Step 22: Create HTML Entry Points

**Files to create:**
- `extension/src/popup/index.html`
- `extension/src/options/index.html`

**Changes needed:**
- Create minimal HTML files that load React
- Import global styles
- Set viewport meta tags
- Add title tags

**Implementation details:**
```html
<!-- popup/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Support Chat AI Assistant</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
```

---

#### Step 23: Add Extension Icons

**Files to create:**
- `extension/public/icons/icon-16.png`
- `extension/public/icons/icon-32.png`
- `extension/public/icons/icon-48.png`
- `extension/public/icons/icon-128.png`

**Changes needed:**
- Create or download icon assets (16x16, 32x32, 48x48, 128x128)
- Use simple design (AI chat bubble or robot icon)
- Save as PNG with transparency

**Implementation details:**
Can use online tools or design manually. Placeholder icons acceptable for development.

---

#### Step 24: Create Unit Tests (Including YOLO Components)

**Files to create:**
- `extension/src/content/context-extractor.test.ts`
- `extension/src/lib/storage.test.ts`
- `extension/src/lib/mock-api.test.ts`
- `extension/src/content/dom-observer.test.ts`
- `extension/src/background/mode-controller.test.ts` (YOLO)
- `extension/src/background/goal-tracker.test.ts` (YOLO)
- `extension/src/content/auto-responder.test.ts` (YOLO)
- `extension/src/content/safety-monitor.test.ts` (YOLO)

**Changes needed:**
- Test context extraction logic
- Test storage utilities (including YOLO state)
- Test mock API responses (both modes)
- Test DOM observer creation and cleanup
- **YOLO Mode**: Test mode switching logic
- **YOLO Mode**: Test goal tracking and progress
- **YOLO Mode**: Test auto-responder injection
- **YOLO Mode**: Test safety checks and escalation triggers
- Use Vitest + happy-dom

**Implementation details:**
```typescript
// goal-tracker.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { GoalTracker } from './goal-tracker'

describe('GoalTracker', () => {
  let tracker: GoalTracker

  beforeEach(() => {
    tracker = new GoalTracker()
  })

  it('should initialize with no goal', () => {
    const state = tracker.getState()
    expect(state.goal).toBeNull()
    expect(state.state).toBeNull()
  })

  it('should set and track goal', async () => {
    await tracker.setGoal({
      type: 'resolve_issue',
      description: 'Test goal',
      max_turns: 5
    })

    const state = tracker.getState()
    expect(state.goal).toBeDefined()
    expect(state.state?.turns_taken).toBe(0)
  })

  it('should increment turns', async () => {
    await tracker.setGoal({
      type: 'resolve_issue',
      description: 'Test goal',
      max_turns: 5
    })

    await tracker.incrementTurn()
    const state = tracker.getState()
    expect(state.state?.turns_taken).toBe(1)
  })

  it('should detect max turns reached', async () => {
    await tracker.setGoal({
      type: 'resolve_issue',
      description: 'Test goal',
      max_turns: 2
    })

    await tracker.incrementTurn()
    await tracker.incrementTurn()

    expect(tracker.hasReachedMaxTurns()).toBe(true)
  })
})

// safety-monitor.test.ts
import { describe, it, expect } from 'vitest'
import { SafetyMonitor } from './safety-monitor'

describe('SafetyMonitor', () => {
  const monitor = new SafetyMonitor({
    max_turns: 10,
    escalation_keywords: ['angry', 'manager'],
    stop_if_confused: true
  })

  it('should detect escalation keywords', () => {
    const message: Message = {
      role: 'customer',
      content: 'I want to speak to your manager!',
      timestamp: Date.now()
    }

    const goalState: GoalState = {
      turns_taken: 2,
      info_gathered: [],
      current_step: 'gathering',
      started_at: Date.now(),
      last_updated: Date.now()
    }

    const check = monitor.checkMessage(message, goalState)
    expect(check.shouldEscalate).toBe(true)
    expect(check.reason).toContain('keyword')
  })

  it('should not escalate on normal message', () => {
    const message: Message = {
      role: 'customer',
      content: 'Thank you for your help',
      timestamp: Date.now()
    }

    const goalState: GoalState = {
      turns_taken: 2,
      info_gathered: [],
      current_step: 'gathering',
      started_at: Date.now(),
      last_updated: Date.now()
    }

    const check = monitor.checkMessage(message, goalState)
    expect(check.shouldEscalate).toBe(false)
  })
})
```

---

#### Step 25: Integration Testing and Manual Verification

**Manual Testing Checklist:**

**Suggestion Mode:**
1. Build extension: `npm run build`
2. Load unpacked extension in Chrome (`chrome://extensions`)
3. Navigate to Zendesk demo site or test chat interface
4. Verify:
   - Content script loads without errors
   - DOM observer detects chat container
   - New messages trigger suggestion request
   - Suggestion panel displays correctly
   - Copy button works
   - Popup opens and shows settings
   - Settings save to chrome.storage
   - Options page accessible and functional

**YOLO Mode:**
1. Open popup and configure a goal
2. Switch to YOLO mode
3. Navigate to chat interface
4. Verify:
   - Live monitor shows goal progress
   - Customer messages trigger autonomous responses
   - AI responses are auto-injected and sent
   - Goal state updates after each turn
   - Safety checks work (try escalation keywords)
   - Emergency stop button immediately halts mode
   - Escalation triggers switch back to suggestion mode
   - Max turns limit is enforced

**Error Scenarios:**
5. Test error scenarios:
   - No chat container found
   - API error (simulate in mock)
   - Invalid message format
   - YOLO mode without goal configured
   - Emergency stop during active conversation

**Performance:**
6. Performance testing:
   - Check memory usage (should be < 50MB)
   - Verify debouncing works (500ms delay)
   - Check for memory leaks (long session)
   - YOLO mode: Verify rate limiting (no runaway responses)

---

### Testing Strategy

**Unit Tests (Vitest):**
- Test utilities (storage, debounce, logger)
- Test context extraction
- Test mock API responses (both modes)
- Test platform detection logic
- **YOLO Mode**: Test mode controller, goal tracker, safety monitor, auto-responder

**Component Tests (React Testing Library):**
- Test popup components
- Test options components
- Test suggestion panel
- **YOLO Mode**: Test mode selector, goal config, live monitor, emergency stop
- Test user interactions (clicks, form submissions)

**Integration Tests:**
- Test message passing between contexts
- Test full flow: DOM change → suggestion → UI injection
- **YOLO Mode**: Test full flow: DOM change → autonomous response → auto-send
- Test chrome.storage integration
- Test mode switching

**Manual Testing:**
- Load extension in Chrome
- Test on actual chat platforms (Zendesk, Intercom)
- Verify all features work end-to-end
- Test error scenarios
- Performance testing
- **YOLO Mode**: Test goal completion scenarios
- **YOLO Mode**: Test safety and escalation mechanisms

**Test Coverage Goals:**
- Utilities: 90%+
- Core logic: 80%+
- Components: 70%+

## 🎯 Success Criteria

### Functional Requirements - Suggestion Mode
✅ Extension loads without errors in Chrome
✅ Content script detects Zendesk and Intercom chat interfaces
✅ DOM observer detects new customer messages
✅ Context extraction works correctly (last 10 messages)
✅ Mock API returns realistic suggestions (500-1500ms latency)
✅ Suggestion panel displays in chat interface
✅ Copy button copies suggestion to clipboard
✅ Popup shows settings and status
✅ User preferences save to chrome.storage
✅ Options page provides advanced configuration

### Functional Requirements - YOLO Mode
✅ Mode selector allows switching between Suggestion and YOLO
✅ Goal configuration interface saves goal and safety constraints
✅ YOLO mode cannot be activated without a configured goal
✅ Autonomous responses are generated and auto-sent
✅ Goal state updates after each turn (turns taken, info gathered)
✅ Live monitor displays real-time conversation and progress
✅ Safety checks detect escalation keywords
✅ Emergency stop button immediately halts YOLO mode
✅ Escalation triggers switch back to suggestion mode
✅ Max turns limit is enforced
✅ Conversation logs saved for YOLO sessions

### Non-Functional Requirements
✅ TypeScript compiles without errors
✅ ESLint passes with no warnings
✅ Extension memory < 50MB
✅ DOM observation debounced to 500ms
✅ All components follow Manifest V3 patterns
✅ No inline scripts (CSP compliant)
✅ Unit test coverage > 70%
✅ **YOLO Mode**: Rate limiting prevents runaway responses (max 1 per 10s)

### User Experience
✅ Suggestion panel doesn't block chat interface
✅ Loading state visible during API call
✅ Error messages user-friendly
✅ Settings intuitive and easy to use
✅ Extension doesn't slow down page load
✅ **YOLO Mode**: Live monitor provides clear visibility into autonomous actions
✅ **YOLO Mode**: Emergency stop is always prominent and accessible
✅ **YOLO Mode**: Goal configuration is simple and has useful presets

### Code Quality
✅ All functions have proper TypeScript types
✅ Code follows project conventions
✅ Comments explain complex logic
✅ No console.error in production build
✅ Cleanup functions prevent memory leaks
✅ **YOLO Mode**: Audit trail logs all autonomous actions

---

## 📦 Deliverables

1. **Fully functional Chrome extension** with:
   - Background service worker with mode controller and goal tracker
   - Content scripts with platform detection, auto-responder, and safety monitor
   - React-based popup with dual-mode UI (mode selector, goal config, live monitor, emergency stop)
   - React-based options UI with YOLO configuration
   - Mock API client for testing (both Suggestion and YOLO modes)

2. **Documentation**:
   - Code comments
   - Updated README with testing instructions for both modes
   - YOLO mode user guide

3. **Tests**:
   - Unit tests for core utilities (both modes)
   - Component tests for React UI (both modes)
   - Manual testing checklist for both modes

4. **Build artifacts**:
   - Development build (unminified)
   - Production build (optimized)

---

## 🔄 Future Enhancements (Post-MVP)

After completing this implementation:

**Suggestion Mode:**
1. **Replace mock API** with real Cloud Run backend
2. **Add caching** for recent suggestions
3. **Implement feedback** mechanism (thumbs up/down)
4. **Add multiple suggestion variants**
5. **Support more platforms** (Freshdesk, Help Scout)
6. **Add keyboard shortcuts**
7. **Implement suggestion history**
8. **Add analytics** (track acceptance rate)

**YOLO Mode:**
1. **Advanced sentiment analysis** (beyond keyword-based)
2. **Confusion detection** (repeated questions)
3. **Multi-goal handling** (parallel goal tracking)
4. **Goal templates library** (expand presets)
5. **Adaptive learning** (learn from human interventions)
6. **Conversation analytics** (goal completion rates, escalation frequency)
7. **Knowledge base integration** (RAG for product-specific info)
8. **Sensitive action confirmation** (require approval for refunds, account changes)
9. **PII detection and masking**
10. **A/B testing of autonomous strategies**

---

## 📋 Implementation Order Summary

### Phase 1: Core Infrastructure (Suggestion Mode Foundation)
1. Mock API client (Suggestion Mode)
2. Chrome storage utilities
3. Platform detection
4. Context extraction
5. DOM observer
6. Background service worker
7. UI injector component
8. Content script entry
9. Debouncing utility
10. Error handling and logging

### Phase 2: YOLO Mode Components
11. Mock API client (YOLO Mode)
12. Mode Controller (Background)
13. Goal Tracker (Background)
14. Auto-Responder (Content Script)
15. Safety Monitor (Content Script)
16. Content script entry (YOLO mode integration)
17. Mode Selector UI (Popup)
18. Goal Configuration UI (Popup)
19. Live Monitor Dashboard (Popup)
20. Emergency Stop Button (Popup)

### Phase 3: Integration & UI
21. Popup UI (Settings, Status, combined layout)
22. Options page (with YOLO configuration)
23. Shared UI components (shadcn/ui)
24. HTML entry points
25. Extension icons

### Phase 4: Testing & Finalization
26. Unit tests (both modes)
27. Component tests (both modes)
28. Integration testing (both modes)
29. Manual verification

**Estimated Time:** 5-7 days for full implementation with testing (both modes).

---

## 🎯 Key Differences from Original Plan

This refined plan incorporates **YOLO Mode** alongside the original **Suggestion Mode**, introducing:

1. **Dual-Mode Architecture**: Mode controller, goal tracker, and mode-aware content scripts
2. **Autonomous Response System**: Auto-responder, safety monitor, and escalation mechanisms
3. **Goal-Oriented Conversation Management**: Goal configuration, progress tracking, and completion detection
4. **Enhanced Safety**: Multiple safety checks, emergency stop, escalation triggers
5. **Real-Time Monitoring**: Live dashboard for YOLO conversations
6. **Additional UI Components**: Mode selector, goal config, live monitor, emergency stop
7. **Extended Mock API**: Support for autonomous response endpoint
8. **Comprehensive Testing**: Additional tests for YOLO-specific components

This plan provides a complete roadmap for implementing the Chrome extension with **both Suggestion and YOLO modes**, using mocked backend responses for immediate development and testing without waiting for backend deployment.
