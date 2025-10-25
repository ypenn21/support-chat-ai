# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that provides AI-powered support automation to support agents. The system monitors support chat interfaces (Zendesk, Intercom, Coinbase) and uses Google Vertex AI Gemini operating in two distinct modes:

**1. Suggestion Mode (Human-in-the-Loop):** AI generates response suggestions in real-time that support agents can review, edit, and send manually.

**2. YOLO Mode (Autonomous Agent):** AI automatically responds to customer messages based on configurable goals (e.g., "Resolve shipping issue," "Gather order information"), with continuous human oversight and emergency controls.

**Tech Stack:**
- Frontend: Chrome Extension (Manifest V3) with TypeScript, React, Vite
- Backend: Python 3.11 + FastAPI on GCP Cloud Run
- AI: Google Vertex AI Gemini 1.5 Pro/Flash
- Infrastructure: GCP (Cloud Run, Firestore, Secret Manager, Artifact Registry)

## Dual-Mode Operation

### Mode Selection

The extension operates in one of two modes at any time:

| Feature | Suggestion Mode | YOLO Mode |
|---------|-----------------|-----------|
| **Control** | Human decides when to send | AI sends automatically |
| **Use Case** | Agent wants AI assistance | Agent wants full automation |
| **Safety** | Human review before sending | Multiple auto-escalation triggers |
| **Goal Setting** | N/A | Required (e.g., "Resolve issue") |
| **Monitoring** | Minimal | Real-time dashboard required |
| **Risk** | Low (human in loop) | Medium (requires safety mechanisms) |

### Key Safety Features for YOLO Mode

1. **Emergency Stop Button**: Immediately halt all auto-responses
2. **Escalation Triggers**: Auto-escalate on keywords, negative sentiment, low confidence
3. **Turn Limits**: Maximum conversation turns (default: 10)
4. **Goal Tracking**: Visual progress toward conversation objectives
5. **Human Takeover**: Agent can intervene at any point
6. **Conversation Logging**: Full transcripts for audit and learning

## Architecture

### Three-Tier System Architecture

```
Chrome Extension (3 contexts)
├── Content Scripts: Injected into support chat pages
│   └── Observes DOM, extracts conversation context, injects UI
├── Background Service Worker: Message routing and API communication
│   └── Handles chrome.runtime messages, calls Cloud Run API
└── Popup/Options UI: React-based configuration interface

Cloud Run Backend (FastAPI)
├── API Routes: /api/suggest-response, /api/auth, /api/feedback
├── Services: Vertex AI integration, context processing, prompt building
└── Models: Pydantic validation models for requests/responses

Vertex AI Gemini
└── Generates response suggestions based on conversation context
```

### Critical Data Flow

**Suggestion Mode:**
1. **Content Script** monitors DOM for new customer messages using MutationObserver
2. **Message Passing**: Content script → Background worker via `chrome.runtime.sendMessage()`
3. **API Call**: Background worker → Cloud Run via HTTPS POST to `/api/suggest-response`
4. **AI Processing**: FastAPI → Vertex AI Gemini with conversation context
5. **Response Chain**: Gemini → FastAPI → Background worker → Content script
6. **UI Injection**: Content script injects suggestion panel into chat interface
7. **Human Review**: Agent reviews, edits, and manually sends response

**YOLO Mode:**
1. **Agent Configuration**: Sets goal (e.g., "Resolve shipping delay") and safety constraints
2. **Autonomous Monitoring**: Content script watches for customer messages
3. **Goal-Oriented Analysis**: Background worker → Cloud Run `/api/autonomous-response` with goal state
4. **AI Decision**: Gemini analyzes goal progress and decides action (Respond/Escalate/Complete)
5. **Safety Checks**: Multiple escalation triggers checked (sentiment, keywords, confidence, max turns)
6. **Auto-Response**: If safe, AI response injected into chat and sent automatically
7. **State Update**: Goal progress tracked, turn count incremented
8. **Continuous Monitoring**: Human can monitor in real-time dashboard, emergency stop always available
9. **Escalation/Completion**: When goal achieved or escalation triggered, handoff to human with full log

### Key Architectural Constraints

**Chrome Extension (Manifest V3):**
- Content scripts CAN access DOM but CANNOT make direct external API calls (CORS)
- Service workers CANNOT access DOM but CAN make API calls
- All external API communication must route through background service worker
- Use `chrome.storage` API for persistence (not localStorage in service worker)
- Content Security Policy: No inline scripts, no eval()

**Python Backend:**
- FastAPI with async/await patterns for Vertex AI calls
- Pydantic models for all request/response validation
- No permanent customer data storage (privacy requirement)
- Service account authentication for GCP services

**Platform Detection:**
- Each support platform (Zendesk, Intercom) requires custom DOM selectors
- Selectors are in `extension/src/content/platforms/`
- Must handle frequent HTML structure changes
- Use multiple fallback selectors to reduce brittleness

## Development Commands

### Extension (TypeScript + React)
```bash
cd extension
npm install
npm run dev          # Vite dev server with hot reload
npm run build        # Production build for Chrome Web Store
npm run lint         # ESLint
npm test             # Vitest unit tests
```

### Backend (Python + FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Local dev server (port 8000)

# Testing
pip install -r requirements-dev.txt
pytest                           # All tests
pytest tests/test_suggest.py    # Single test file
pytest -k "test_name"            # Single test
pytest --cov=app                 # With coverage
```

### Docker (Local Backend Testing)
```bash
cd backend
docker build -t support-chat-ai-backend .
docker run -p 8080:8080 \
  -e GCP_PROJECT_ID=your-project \
  -e VERTEX_AI_LOCATION=us-central1 \
  support-chat-ai-backend
```

### GCP Deployment
```bash
# Build and push Docker image
cd backend
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/support-chat-ai/backend:latest .
docker push us-central1-docker.pkg.dev/PROJECT_ID/support-chat-ai/backend:latest

# Deploy to Cloud Run
gcloud run deploy support-chat-ai \
  --image=us-central1-docker.pkg.dev/PROJECT_ID/support-chat-ai/backend:latest \
  --region=us-central1 \
  --platform=managed

# Test deployment
curl $(gcloud run services describe support-chat-ai --region=us-central1 --format='value(status.url)')/health
```

## Project Structure (When Implemented)

```
extension/src/
├── background/        # Service worker (Manifest V3)
│   ├── api-client.ts         # HTTP client for Cloud Run API
│   ├── message-router.ts     # Routes messages between content/popup
│   ├── auth-manager.ts       # Manages API keys/tokens
│   ├── mode-controller.ts    # Switches between Suggestion/YOLO modes
│   └── goal-tracker.ts       # Tracks YOLO goal progress (YOLO Mode)
├── content/           # Injected into support chat pages
│   ├── dom-observer.ts       # MutationObserver for chat messages
│   ├── context-extractor.ts  # Extracts conversation context
│   ├── ui-injector.tsx       # React component for suggestion panel (Suggestion Mode)
│   ├── auto-responder.ts     # Auto-inject and send AI responses (YOLO Mode)
│   ├── safety-monitor.ts     # Client-side escalation detection (YOLO Mode)
│   └── platforms/            # Platform-specific DOM selectors
│       ├── zendesk.ts
│       ├── intercom.ts
│       └── generic.ts
├── popup/             # Extension popup UI (React)
│   ├── App.tsx               # Main popup component
│   ├── components/
│   │   ├── ModeSelector.tsx      # Switch between modes
│   │   ├── Settings.tsx          # User preferences (Suggestion Mode)
│   │   ├── GoalConfig.tsx        # Goal configuration (YOLO Mode)
│   │   ├── LiveMonitor.tsx       # Real-time conversation view (YOLO Mode)
│   │   ├── EmergencyStop.tsx     # Stop button (YOLO Mode)
│   │   └── History.tsx           # Past conversations
├── options/           # Options page UI (React)
│   ├── App.tsx
│   ├── components/
│   │   ├── YoloConfig.tsx        # YOLO mode settings
│   │   ├── GoalTemplates.tsx     # Pre-defined goal templates
│   │   └── SafetyRules.tsx       # Escalation trigger configuration
└── lib/               # Shared utilities
    ├── storage.ts            # Chrome storage wrapper
    ├── api.ts                # API client helpers
    └── utils.ts              # General utilities

backend/app/
├── main.py            # FastAPI app entry point
├── api/routes/        # API endpoints
│   ├── suggest.py             # POST /api/suggest-response (Suggestion Mode)
│   ├── autonomous.py          # POST /api/autonomous-response (YOLO Mode)
│   ├── auth.py                # Authentication endpoints
│   ├── feedback.py            # Feedback collection
│   └── conversation_logs.py   # GET /api/conversation-logs (YOLO transcripts)
├── services/
│   ├── gemini.py              # Vertex AI integration
│   ├── context_processor.py  # Process conversation context
│   ├── prompt_builder.py     # Build prompts for Gemini (Suggestion Mode)
│   ├── goal_manager.py        # Goal tracking and progress (YOLO Mode)
│   ├── safety_checker.py      # Escalation detection (YOLO Mode)
│   └── autonomous_prompt.py   # Goal-oriented prompts (YOLO Mode)
├── models/            # Pydantic models
│   ├── request.py     # SuggestRequest, Message, UserPreferences
│   ├── response.py    # SuggestResponse, Suggestion, Metadata
│   ├── yolo.py        # YoloRequest, GoalState, SafetyConstraints, YoloResponse
│   └── goals.py       # GoalTemplate, GoalProgress, EscalationTrigger
└── core/
    ├── config.py      # Settings (from env vars)
    └── security.py    # Authentication logic
```

## Key Code Patterns

### Chrome Extension Message Passing
```typescript
// Content script → Background worker
chrome.runtime.sendMessage({
  type: 'GET_SUGGESTION',
  payload: { context, platform }
}, (response) => {
  // Handle suggestion
});

// Background worker listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SUGGESTION') {
    callBackendAPI(message.payload)
      .then(sendResponse);
    return true; // Required for async response
  }
});
```

### FastAPI with Vertex AI
```python
# Vertex AI integration pattern
import vertexai
from vertexai.generative_models import GenerativeModel

vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel("gemini-1.5-pro")
response = await model.generate_content_async(prompt)

# FastAPI endpoint with Pydantic validation
@app.post("/api/suggest-response", response_model=SuggestResponse)
async def suggest_response(request: SuggestRequest):
    # Pydantic automatically validates request
    suggestion = await generate_suggestion(request)
    return SuggestResponse(suggestions=[suggestion], metadata={...})
```

### DOM Observation Pattern
```typescript
// Observe chat messages without blocking
const observer = new MutationObserver(
  debounce((mutations) => {
    const newMessages = extractMessages(mutations);
    if (newMessages.length > 0) {
      requestSuggestion(newMessages);
    }
  }, 500) // Debounce to avoid excessive calls
);

observer.observe(chatContainer, {
  childList: true,
  subtree: true
});
```

## Platform-Specific Notes

### Zendesk
- Chat widget often in iframe
- Message selectors: `.chat-msg-text`, `.chat-wrapper`
- Need to wait for iframe load before observing

### Intercom
- Uses Shadow DOM (harder to access)
- Message selectors: `.intercom-message`, `.intercom-composer-input`
- May require special Shadow DOM handling

### Generic Platforms
- Fallback to common patterns when platform is unknown
- Allow user configuration of custom selectors
- Look for `[role="log"]`, `[aria-label*="chat"]`, etc.

## Configuration & Environment

### Extension Environment Variables
```env
VITE_API_URL=https://your-cloud-run-url
VITE_ENV=development
```

### Backend Environment Variables
```env
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-1.5-pro  # or gemini-1.5-flash
API_KEY_SECRET_NAME=api-key  # Secret Manager secret name
```

### GCP Services Required
- Cloud Run (backend hosting)
- Vertex AI (Gemini API)
- Artifact Registry (Docker images)
- Secret Manager (API keys)
- Firestore (optional: analytics/feedback)
- Cloud Logging & Monitoring

## Security & Privacy Requirements

1. **No Permanent Customer Data Storage**: Conversation context is only held in memory during request processing
2. **API Key Encryption**: Store API keys encrypted in chrome.storage, never in code
3. **Service Account Permissions**: Minimum required: `aiplatform.user`, `secretmanager.secretAccessor`, `datastore.user`
4. **Input Validation**: All API inputs validated with Pydantic schemas
5. **HTTPS Only**: No unencrypted communication
6. **Rate Limiting**: Implement per-user rate limits to prevent abuse

## Performance Targets

- **Suggestion Latency**: < 2 seconds from customer message to displayed suggestion
- **Extension Memory**: < 50MB total memory footprint
- **DOM Observation**: Debounced to 500ms to avoid performance impact
- **API Rate Limit**: 60 requests/minute per user
- **Cache**: Store last 10 conversations locally to reduce API calls

## Testing Strategy

### Extension Testing
- Unit tests with Vitest for utilities and business logic
- Component tests with React Testing Library for UI
- E2E tests with Playwright to test on actual chat platforms
- Load unpacked extension in `chrome://extensions` for manual testing

### Backend Testing
- Unit tests with pytest for services and utilities
- API tests with FastAPI TestClient (httpx)
- Integration tests with mocked Vertex AI responses
- Load tests with locust for performance validation

## Detailed Documentation

Comprehensive documentation is in `.claude/docs/`:
- `project-design.md` - Full architecture, features, and roadmap
- `tech-stack.md` - Complete dependency list and configuration
- `project-context.md` - Development patterns and constraints
- `architecture-diagrams.md` - Visual system diagrams
- `dockerfile-example.md` - Docker configuration examples

## Slash Commands Available

- `/setup` - Initialize project structure (extension + backend directories)
- `/gcp-setup` - Complete GCP infrastructure setup with gcloud commands
- `/implement` - Implement features with full project context
- `/review` - Code review focused on Chrome extension and FastAPI patterns
- `/test` - Generate tests for extension or backend
- `/explain` - Get detailed explanations of code architecture

## Agents

Agents are specialized assistants that autonomously handle specific tasks. Available agents are defined in `.claude/agents/`:

### code-reviewer
**File:** `.claude/agents/code-review.md`
**Usage:** Invoke after writing or modifying code

Automatically reviews code for:
- **Chrome Extension**: Manifest V3 compliance, message passing patterns, CORS constraints
- **Python Backend**: Async/await patterns, Pydantic validation, Vertex AI integration
- **Security**: No secrets in code, input validation, privacy compliance
- **Performance**: Memory leaks, debouncing, caching
- **Code Quality**: Naming, function size, DRY principle

Process:
1. Runs `git diff` to identify modified files
2. Reviews changes against project-specific patterns
3. Provides structured feedback with priorities: Critical 🔴 / Warnings 🟡 / Suggestions 🟢

### debugger
**File:** `.claude/agents/debugger.md`
**Usage:** Invoke when encountering errors, test failures, or unexpected behavior

Debugging specialist that:
1. Captures error messages and stack traces
2. Identifies reproduction steps
3. Isolates failure location
4. Implements minimal fix
5. Verifies solution works

Provides:
- Root cause explanation with supporting evidence
- Specific code fixes
- Testing approach
- Prevention recommendations

See `.claude/docs/sub-agents-guide.md` for how to create more agents.
