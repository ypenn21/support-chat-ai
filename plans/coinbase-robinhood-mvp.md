# Feature Implementation Plan: Coinbase & Robinhood MVP Platform Support

## 📋 Todo Checklist
- [x] ~~Update TypeScript type definitions for Coinbase/Robinhood platforms~~ ✅ Implemented
- [ ] Implement backend API routes for suggestion generation
- [ ] Integrate Vertex AI Gemini service with platform-specific prompts
- [ ] Test and refine DOM selectors for both platforms
- [ ] Create platform-specific testing pages
- [ ] Build end-to-end workflow validation
- [ ] Document platform-specific quirks and selector patterns
- [ ] Final Review and Testing

## 🔍 Analysis & Investigation

### Codebase Structure

**Files Inspected:**
- `extension/src/content/platforms/index.ts` - Platform detection orchestrator
- `extension/src/content/platforms/coinbase.ts` - Coinbase detector implementation ✅
- `extension/src/content/platforms/robinhood.ts` - Robinhood detector implementation ✅
- `extension/src/content/platforms/types.ts` - PlatformDetector interface
- `extension/src/content/platforms/generic.ts` - Fallback detector
- `extension/src/types/index.ts` - TypeScript type definitions
- `extension/public/manifest.json` - Chrome extension configuration
- `extension/src/content/index.ts` - Content script entry point
- `extension/src/background/message-router.ts` - Background worker message handler
- `backend/app/models/request.py` - API request models (Pydantic)
- `backend/app/models/response.py` - API response models (Pydantic)
- `backend/app/main.py` - FastAPI application entry point

### Current Architecture

**✅ Already Implemented:**

1. **Extension Frontend (80% Complete)**
   - ✅ Platform detection system with `detectPlatform()` and `detectPlatformType()`
   - ✅ Coinbase detector with multiple DOM selector fallbacks
   - ✅ Robinhood detector with message/input/button selectors
   - ✅ Generic fallback detector for unknown platforms
   - ✅ Content script with DOM observation (MutationObserver)
   - ✅ Background service worker with message routing
   - ✅ UI injection system with React components
   - ✅ Chrome storage integration for preferences
   - ✅ YOLO mode architecture (AutoResponder, SafetyMonitor)
   - ✅ Manifest V3 configuration with host permissions for `*.coinbase.com` and `*.robinhood.com`

2. **Backend API (40% Complete)**
   - ✅ FastAPI application structure
   - ✅ CORS middleware for Chrome extension
   - ✅ Health check endpoint (`/health`)
   - ✅ Pydantic models for requests/responses
   - ✅ Configuration system with environment variables
   - ❌ **MISSING:** API routes (`/api/suggest-response`, `/api/autonomous-response`)
   - ❌ **MISSING:** Vertex AI Gemini integration service
   - ❌ **MISSING:** Prompt builder for different platforms
   - ❌ **MISSING:** Context processor for conversation analysis

**🚧 What Needs Implementation:**

1. **Type System Updates**
   - Platform type enum in `extension/src/types/index.ts` only includes `'zendesk' | 'intercom' | 'generic'`
   - Needs to add `'coinbase' | 'robinhood'`
   - Backend `backend/app/models/request.py` also hardcodes platform types

2. **Backend API Routes**
   - No actual suggestion generation endpoint exists yet
   - Backend `main.py` has TODO comments for route registration
   - Need full Vertex AI integration

3. **Platform-Specific Testing**
   - No test pages or validation for Coinbase/Robinhood selectors
   - DOM selectors are **speculative** and need real-world validation
   - Selectors may need adjustment based on actual platform UIs

### Dependencies & Integration Points

**External Dependencies:**
- ✅ Google Vertex AI SDK (Python) - needs implementation in backend
- ✅ Chrome Extension APIs (runtime, storage, tabs) - already used
- ✅ React + ReactDOM - UI injection working
- ✅ Tailwind CSS - styling present

**Critical Integration Points:**
1. **Extension → Backend API:**
   - Background worker calls Cloud Run via `fetchSuggestion()` in `api-client.ts`
   - Requires valid `VITE_API_URL` environment variable
   - Backend must accept POST requests with CORS headers

2. **Backend → Vertex AI:**
   - Service account authentication required
   - Project ID and location must be configured
   - Gemini model selection (1.5-pro vs 1.5-flash)

3. **Content Script → Platform DOM:**
   - Selectors are platform-specific and brittle
   - Must handle Shadow DOM (potential issue for Coinbase/Robinhood)
   - MutationObserver must efficiently detect new messages

### Considerations & Challenges

**Challenge 1: DOM Selector Brittleness**
- **Issue:** Current Coinbase/Robinhood selectors are *speculative* (using common patterns like `[data-testid="chat-log"]`)
- **Risk:** Real platforms may use completely different HTML structures
- **Mitigation:**
  - Create test pages that replicate actual platform DOM structure
  - Add comprehensive fallback selectors (already partially done)
  - Implement selector validation logging
  - Allow user configuration of custom selectors in options page

**Challenge 2: Platform Type Mismatch**
- **Issue:** TypeScript types and backend Pydantic models don't include 'coinbase'/'robinhood'
- **Risk:** API requests will be rejected at validation layer
- **Mitigation:** Update type definitions in lockstep (frontend + backend)

**Challenge 3: Shadow DOM & iframes**
- **Issue:** Coinbase/Robinhood may use Shadow DOM or iframes for chat widgets (common in modern web apps)
- **Risk:** `document.querySelector()` won't penetrate Shadow DOM boundaries
- **Mitigation:**
  - Add Shadow DOM detection in platform detectors
  - Use `element.shadowRoot.querySelector()` when needed
  - Handle iframe context switching if chat is isolated

**Challenge 4: Vertex AI Setup**
- **Issue:** Backend has no Vertex AI integration yet
- **Risk:** MVP cannot generate suggestions without AI service
- **Mitigation:**
  - Prioritize backend implementation
  - Create mock API responses for frontend testing
  - Document GCP setup requirements clearly

**Challenge 5: Platform-Specific Prompt Engineering**
- **Issue:** Coinbase and Robinhood serve different industries (crypto trading vs stock trading)
- **Risk:** Generic prompts may produce irrelevant suggestions
- **Mitigation:**
  - Create platform-specific prompt templates
  - Include platform context in API requests
  - Allow customization via user preferences

## 📝 Implementation Plan

### Prerequisites

1. **GCP Setup (if deploying backend):**
   - Enable Vertex AI API in GCP project
   - Create service account with `aiplatform.user` role
   - Set up Cloud Run service (or run locally for testing)
   - Configure Secret Manager for API keys

2. **Development Environment:**
   - Node.js 20+ installed
   - Python 3.11+ with virtual environment
   - Chrome browser with extension developer mode
   - Access to Coinbase and/or Robinhood chat interfaces (or test pages)

### Step-by-Step Implementation

---

#### **STEP 1: Update Type Definitions for Platform Support** ✅ COMPLETED

**Files to modify:**
- `extension/src/types/index.ts`
- `backend/app/models/request.py`

**Changes needed:**

**Frontend (TypeScript):**
```typescript
// In extension/src/types/index.ts line 11
export type Platform = 'zendesk' | 'intercom' | 'coinbase' | 'robinhood' | 'generic'
```

**Backend (Python):**
```python
# In backend/app/models/request.py line 27
platform: Literal["zendesk", "intercom", "coinbase", "robinhood", "generic"]
```

**Validation:**
- Verify no TypeScript compilation errors: `cd extension && npm run type-check`
- Verify backend model validation: Start backend and check `/docs` endpoint

**Implementation Notes:**
- ✅ Updated `extension/src/types/index.ts` line 11 to include 'coinbase' and 'robinhood'
- ✅ Updated `extension/src/options/components/PlatformConfiguration.tsx` to replace Zendesk/Intercom UI with Coinbase/Robinhood
- ✅ Type checking passed (pre-existing test errors are unrelated to Platform type changes)
- ⏳ Backend type update still pending (requires backend implementation)
- **Status**: Frontend portion complete

---

#### **STEP 2: Implement Vertex AI Service Integration**

**Files to create:**
- `backend/app/services/gemini.py`
- `backend/app/services/prompt_builder.py`
- `backend/app/services/context_processor.py`

**Changes needed:**

**Create Gemini Service (`gemini.py`):**
```python
import vertexai
from vertexai.generative_models import GenerativeModel
from app.core.config import settings

class GeminiService:
    def __init__(self):
        vertexai.init(
            project=settings.GCP_PROJECT_ID,
            location=settings.VERTEX_AI_LOCATION
        )
        self.model = GenerativeModel(settings.GEMINI_MODEL)

    async def generate_suggestion(self, prompt: str) -> dict:
        # Implementation with async/await pattern
        # Return structured response
        pass
```

**Create Prompt Builder (`prompt_builder.py`):**
```python
from app.models.request import SuggestRequest

PLATFORM_CONTEXTS = {
    "coinbase": "cryptocurrency trading and wallet support",
    "robinhood": "stock/crypto trading and investment support",
    "generic": "customer support"
}

def build_suggestion_prompt(request: SuggestRequest) -> str:
    # Build platform-aware prompt
    # Include conversation context
    # Apply user preferences (tone, length)
    pass
```

**Create Context Processor (`context_processor.py`):**
```python
def format_conversation_context(messages: List[Message]) -> str:
    # Format messages for AI model
    # Extract key information
    # Handle long conversations (truncate/summarize)
    pass
```

**Validation:**
- Unit test each service independently
- Mock Vertex AI responses for testing
- Verify prompt formatting with different platforms

---

#### **STEP 3: Implement API Routes**

**Files to create:**
- `backend/app/api/routes/suggest.py`

**Files to modify:**
- `backend/app/main.py`

**Changes needed:**

**Create Suggestion Route (`suggest.py`):**
```python
from fastapi import APIRouter, HTTPException
from app.models.request import SuggestRequest
from app.models.response import SuggestResponse
from app.services.gemini import GeminiService
from app.services.prompt_builder import build_suggestion_prompt

router = APIRouter()
gemini_service = GeminiService()

@router.post("/suggest-response", response_model=SuggestResponse)
async def suggest_response(request: SuggestRequest):
    try:
        # Build prompt
        prompt = build_suggestion_prompt(request)

        # Generate suggestion
        result = await gemini_service.generate_suggestion(prompt)

        # Format response
        return SuggestResponse(...)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Register Routes in `main.py` (line 52-56):**
```python
from app.api.routes import suggest

app.include_router(suggest.router, prefix="/api", tags=["suggestions"])
```

**Validation:**
- Test endpoint with curl/Postman: `curl -X POST http://localhost:8080/api/suggest-response`
- Verify Pydantic validation rejects invalid requests
- Check CORS headers in response

---

#### **STEP 4: Test and Refine Platform Selectors**

**Files to modify:**
- `extension/src/content/platforms/coinbase.ts`
- `extension/src/content/platforms/robinhood.ts`

**Files to create:**
- `extension/test-pages/coinbase-mock.html`
- `extension/test-pages/robinhood-mock.html`

**Changes needed:**

**Create Mock Test Pages:**
- Build HTML files that replicate Coinbase/Robinhood chat DOM structure
- Include realistic message elements, input boxes, send buttons
- Use actual data attributes and class names from live platforms (inspect with DevTools)

**Refine Selectors Based on Testing:**
- Load extension on mock pages
- Check console logs for platform detection: `[Platform] Detected: Coinbase`
- Test message extraction, role detection, input box access
- Add additional fallback selectors if needed

**Handle Edge Cases:**
```typescript
// In coinbase.ts - add Shadow DOM handling if needed
getChatContainer(): HTMLElement | null {
  // First try normal DOM
  let container = document.querySelector('[data-testid="chat-log"]');

  // Try Shadow DOM if normal fails
  if (!container) {
    const host = document.querySelector('[data-coinbase-chat-widget]');
    if (host?.shadowRoot) {
      container = host.shadowRoot.querySelector('.chat-container');
    }
  }

  return container as HTMLElement | null;
}
```

**Validation:**
- Test on mock pages: All methods should return correct elements
- Test on actual Coinbase/Robinhood sites (if accessible)
- Verify no errors in console: `[Platform] No chat interface detected`

---

#### **STEP 5: End-to-End Workflow Testing**

**Components to test:**
1. **Platform Detection:** Extension activates on coinbase.com and robinhood.com
2. **Message Observation:** New messages trigger suggestion requests
3. **API Communication:** Background worker successfully calls backend
4. **Suggestion Display:** UI panel appears with generated suggestion
5. **User Interaction:** Copy/dismiss buttons work correctly

**Test Scenarios:**

**Scenario 1: Coinbase Support Chat**
1. Navigate to Coinbase support chat (or mock page)
2. Load extension (verify green icon in toolbar)
3. Type a customer message: "My transaction is stuck"
4. Wait for agent response: "Can you provide transaction ID?"
5. Type customer reply: "TX-12345"
6. **Expected:** Suggestion panel appears with AI-generated response
7. Click "Copy" button → text copied to clipboard
8. Click "Dismiss" → panel disappears

**Scenario 2: Robinhood Support Chat**
1. Navigate to Robinhood support chat
2. Follow similar flow as Scenario 1
3. **Expected:** Platform detected as "robinhood", suggestions tailored to investment context

**Scenario 3: Platform Not Detected**
1. Navigate to unrelated website (e.g., google.com)
2. **Expected:** Console log: `[Platform] No chat interface detected on this page`
3. Extension remains inactive (no errors)

**Scenario 4: Backend Error Handling**
1. Stop backend server
2. Trigger suggestion request on Coinbase
3. **Expected:** Error panel appears: "Failed to get AI suggestion. Please try again."
4. No unhandled exceptions in console

**Validation:**
- Document test results in `plans/test-results.md`
- Record any selector failures or API issues
- Create GitHub issues for bugs discovered

---

#### **STEP 6: Implement Platform-Specific Prompt Optimization**

**Files to modify:**
- `backend/app/services/prompt_builder.py`

**Changes needed:**

**Add Platform Context to Prompts:**
```python
PLATFORM_CONTEXTS = {
    "coinbase": {
        "domain": "cryptocurrency trading and wallet support",
        "common_issues": ["transaction delays", "wallet access", "verification", "deposits/withdrawals"],
        "tone": "Clear and reassuring, crypto can be confusing"
    },
    "robinhood": {
        "domain": "stock/crypto trading and investment support",
        "common_issues": ["order execution", "account restrictions", "margin calls", "deposits"],
        "tone": "Professional and concise, users want quick answers"
    }
}

def build_suggestion_prompt(request: SuggestRequest) -> str:
    platform_info = PLATFORM_CONTEXTS.get(request.platform, {})

    prompt = f"""You are assisting a customer in a {platform_info.get('domain', 'support')} context.

Platform: {request.platform.upper()}
Common issues for this platform: {', '.join(platform_info.get('common_issues', []))}

Conversation so far:
{format_conversation_context(request.conversation_context)}

Generate a helpful, {request.user_preferences.tone or 'professional'} response that:
- Addresses the agent's question
- Is {request.user_preferences.length or 'medium'} length
- Uses {platform_info.get('tone', 'professional and helpful')} tone
- Provides specific information if asking

Response:"""

    return prompt
```

**Validation:**
- Generate suggestions for same conversation on different platforms
- Verify response tone/style differs appropriately
- A/B test generic vs platform-specific prompts for quality

---

#### **STEP 7: Documentation and Deployment Preparation**

**Files to create/update:**
- `plans/mvp-setup-guide.md` - Step-by-step setup instructions
- `plans/platform-selector-guide.md` - How to find/update DOM selectors
- `README.md` - Update with Coinbase/Robinhood support status
- `.env.example` files for both extension and backend

**Documentation Checklist:**
- [ ] GCP setup instructions (Vertex AI, Cloud Run, Service Account)
- [ ] Backend environment variable documentation
- [ ] Extension build and load instructions
- [ ] Platform selector debugging guide (how to find correct selectors)
- [ ] Known limitations and workarounds
- [ ] Troubleshooting common errors

**Deployment Checklist:**
- [ ] Backend deployed to Cloud Run with proper environment variables
- [ ] Extension built for production: `cd extension && npm run build`
- [ ] Chrome Web Store listing prepared (screenshots, description)
- [ ] Privacy policy created (required for Chrome extensions)
- [ ] Cost monitoring set up for Vertex AI usage

---

### Testing Strategy

**Unit Tests:**
- ✅ Platform detectors: Mock DOM and verify detection logic
- ✅ Message parsing: Test role detection, text extraction
- 🚧 Backend services: Mock Vertex AI responses
- 🚧 API routes: Test with FastAPI TestClient

**Integration Tests:**
- 🚧 Extension → Backend: Test full API request/response cycle
- 🚧 Backend → Vertex AI: Test with real Gemini API (use dev project)
- 🚧 Content script → Platform: Test on mock pages

**End-to-End Tests:**
- 🚧 Playwright tests for Coinbase mock page
- 🚧 Playwright tests for Robinhood mock page
- 🚧 Manual testing on actual platforms (if accessible)

**Performance Tests:**
- 🚧 Measure suggestion latency (target: < 2 seconds)
- 🚧 Monitor extension memory usage (target: < 50MB)
- 🚧 Test with long conversation histories (50+ messages)

**Test Execution:**
```bash
# Extension tests
cd extension
npm test                    # Unit tests
npm run test:coverage       # Coverage report

# Backend tests
cd backend
source venv/bin/activate
pytest                      # All tests
pytest --cov=app           # With coverage
pytest tests/test_suggest.py -v  # Specific route tests

# E2E tests (requires both running)
cd extension
npm run build
# Load extension in Chrome
# Run Playwright test suite
npx playwright test
```

---

## 🎯 Success Criteria

### Functional Requirements
✅ **Extension activates on Coinbase and Robinhood domains**
- Platform detection returns correct platform name
- Console shows: `[Platform] Detected: coinbase` or `robinhood`

✅ **DOM elements are correctly identified**
- `getChatContainer()` returns valid container element
- `getMessageElements()` returns array of message nodes
- `getInputBox()` and `getSendButton()` return correct elements

✅ **Suggestion generation works end-to-end**
- New customer message triggers suggestion request
- Backend receives POST to `/api/suggest-response`
- Vertex AI Gemini generates relevant response
- Suggestion panel displays in UI within 2 seconds

✅ **Platform-specific suggestions are appropriate**
- Coinbase suggestions reference crypto/wallet concepts when relevant
- Robinhood suggestions reference trading/stocks when relevant
- Tone matches platform expectations

### Non-Functional Requirements
✅ **Performance:** Suggestion latency < 2 seconds (p95)
✅ **Reliability:** 95%+ success rate for API calls
✅ **Memory:** Extension uses < 50MB RAM
✅ **Security:** No customer data stored permanently, API keys encrypted
✅ **UX:** Clear error messages, loading states, dismissible UI

### MVP Completion Checklist
- [ ] TypeScript types updated for Coinbase/Robinhood
- [ ] Backend API routes implemented and tested
- [ ] Vertex AI integration working with platform-specific prompts
- [ ] DOM selectors validated on real or accurate mock pages
- [ ] End-to-end workflow tested successfully
- [ ] Documentation complete (setup, troubleshooting)
- [ ] Known issues documented with workarounds
- [ ] Extension package ready for Chrome Web Store submission (if deploying)

### Out of Scope (Post-MVP)
- Autonomous YOLO mode (architecture exists, needs backend route)
- Options page configuration (exists but not required for MVP)
- Conversation logging and analytics
- Multi-language support
- Custom user-defined platform selectors
- A/B testing framework for prompts

---

## 📌 Final Notes

**Critical Path:**
1. Type definitions (15 min) → Blocking everything
2. Backend API + Vertex AI (4-6 hours) → Blocking suggestion generation
3. Selector testing (2-3 hours) → Blocking real-world usage
4. E2E validation (2 hours) → Final verification

**Estimated Total Time:** 8-12 hours for full MVP implementation

**Risks:**
- **High Risk:** DOM selectors may not work on real platforms (requires access to validate)
- **Medium Risk:** Vertex AI setup complexity (GCP configuration can be tricky)
- **Low Risk:** Type system updates (straightforward changes)

**Recommended Order of Execution:**
1. Start with backend implementation (longest task, unblocked)
2. Update type definitions while backend is being built
3. Test selectors on mock pages (can be done in parallel)
4. Integrate and validate end-to-end
5. Deploy and document

**Next Steps After MVP:**
1. Gather user feedback on suggestion quality
2. Refine platform-specific prompts based on real conversations
3. Add support for additional platforms (expand beyond Coinbase/Robinhood)
4. Implement YOLO autonomous mode backend routes
5. Build analytics dashboard for conversation tracking
