# Feature Implementation Plan: Backend Integration with FastAPI CRUD REST API

## 📋 Todo Checklist
- [ ] Set up backend development environment and dependencies
- [ ] Implement Vertex AI Gemini service integration
- [ ] Create CRUD API endpoints (Suggestion Mode)
- [ ] Create CRUD API endpoints (YOLO/Autonomous Mode)
- [ ] Implement conversation logging and analytics
- [ ] Add authentication and rate limiting middleware
- [ ] Replace mock API client with real API calls in extension
- [ ] Test backend endpoints locally
- [ ] Deploy backend to Google Cloud Run
- [ ] Configure GCP services (Vertex AI, Secret Manager, Firestore)
- [ ] End-to-end testing with extension
- [ ] Final Review and Testing

## 🔍 Analysis & Investigation

### API Specification

**OpenAPI Specification:**
- ✅ **Complete OpenAPI 3.0 spec created**: `docs/api-spec.yaml` (919 lines)
- ✅ **All endpoints defined**: health, suggest-response, autonomous-response, feedback, conversation-logs
- ✅ **Request/Response models**: Full Pydantic-compatible schema definitions
- ✅ **Examples included**: Request/response examples for all endpoints
- ✅ **Error responses**: 400, 401, 429, 500, 503 error schemas
- ✅ **Security definitions**: API key authentication via X-API-Key header

**Key Endpoints from Spec:**
1. `GET /health` - Health check (no auth)
2. `POST /api/suggest-response` - Suggestion Mode (SuggestRequest → SuggestResponse)
3. `POST /api/autonomous-response` - YOLO Mode (AutonomousRequest → AutonomousResponse)
4. `POST /api/feedback` - Feedback submission (FeedbackRequest → success)
5. `GET /api/conversation-logs` - Retrieve logs (query params → ConversationLogMetadata[])
6. `POST /api/conversation-logs` - Save logs (ConversationLogCreate → success)

**Schema Reference:**
All implementation must match schemas defined in `docs/api-spec.yaml`:
- Request models: Message, UserPreferences, SuggestRequest, Goal, GoalState, SafetyConstraints, AutonomousRequest, FeedbackRequest, ConversationLogCreate
- Response models: Suggestion, Metadata, SuggestResponse, AutonomousResponse, ConversationLogMetadata, Error

### Codebase Structure

**Backend Status:**
The FastAPI backend skeleton exists at `/backend` with the following structure:
- ✅ Project structure defined (`app/api/routes/`, `app/services/`, `app/models/`, `app/core/`)
- ✅ Pydantic models created (`request.py`, `response.py`)
- ✅ Configuration management with `pydantic-settings`
- ✅ Main FastAPI app initialized with CORS and health check
- ✅ **OpenAPI specification complete** (`docs/api-spec.yaml`)
- ❌ **API routes NOT implemented** (only TODO comments exist)
- ❌ **Services NOT implemented** (directories empty)
- ❌ **Vertex AI integration NOT implemented**
- ❌ **Authentication NOT implemented**

**Extension Status:**
- ✅ Extension fully built with mock API
- ✅ Background service worker with API client (`background/api-client.ts`)
- ✅ TypeScript types matching backend Pydantic models
- ✅ Currently using `mock-api.ts` for all API calls
- 🔄 Ready to replace mock with real API calls

**Key Files Inspected:**
1. `/backend/app/main.py` - FastAPI entry point (basic setup only)
2. `/backend/app/models/request.py` - Request models (SuggestRequest, Message, UserPreferences)
3. `/backend/app/models/response.py` - Response models (SuggestResponse, Suggestion, Metadata)
4. `/backend/app/core/config.py` - Pydantic Settings for configuration
5. `/backend/requirements.txt` - Dependencies including Vertex AI SDK
6. `/extension/src/background/api-client.ts` - Extension API client (currently using mock)
7. `/extension/src/lib/mock-api.ts` - Mock API implementation to be replaced
8. **`/docs/api-spec.yaml`** - Complete OpenAPI 3.0 specification

### Current Architecture

**Technology Stack:**
- **Backend**: FastAPI 0.109.0, Python 3.11+, Uvicorn, Gunicorn
- **AI**: Google Vertex AI SDK 1.71.0, Gemini 1.5 Pro/Flash
- **Validation**: Pydantic 2.5.0
- **GCP Services**: Vertex AI, Secret Manager, Firestore, Cloud Logging
- **Extension**: TypeScript, Chrome Manifest V3
- **API Documentation**: OpenAPI 3.0.3

**Backend Structure:**
```
backend/app/
├── main.py                   # FastAPI app entry (✅ basic setup)
├── api/routes/               # API endpoints (❌ empty)
│   ├── suggest.py            # TO CREATE: POST /api/suggest-response
│   ├── autonomous.py         # TO CREATE: POST /api/autonomous-response
│   ├── feedback.py           # TO CREATE: POST /api/feedback
│   └── logs.py               # TO CREATE: GET/POST /api/conversation-logs
├── services/                 # Business logic (❌ empty)
│   ├── gemini.py             # TO CREATE: Vertex AI integration
│   ├── prompt_builder.py     # TO CREATE: Prompt engineering
│   ├── context_processor.py  # TO CREATE: Process conversation context
│   └── analytics.py          # TO CREATE: Track usage metrics
├── models/                   # Data models (✅ complete)
│   ├── request.py            # SuggestRequest, Message, UserPreferences
│   └── response.py           # SuggestResponse, Suggestion, Metadata
└── core/                     # Core utilities (✅ config only)
    ├── config.py             # Settings management
    ├── security.py           # TO CREATE: Auth & rate limiting
    └── database.py           # TO CREATE: Firestore client
```

**Documentation Structure:**
```
docs/
└── api-spec.yaml             # ✅ OpenAPI 3.0 specification (919 lines)
```

### Dependencies & Integration Points

**Required GCP Services:**
1. **Vertex AI** - Gemini 1.5 Pro/Flash for response generation
2. **Secret Manager** - Store API keys securely
3. **Firestore** - Store conversation logs and analytics
4. **Cloud Logging** - Application logs
5. **Artifact Registry** - Docker image storage
6. **Cloud Run** - Serverless deployment

**Integration Flow:**
```
Extension (Content Script)
    ↓ chrome.runtime.sendMessage()
Background Service Worker (api-client.ts)
    ↓ HTTP POST (fetch/axios)
Cloud Run Backend (FastAPI)
    ↓ async call
Vertex AI Gemini 1.5 Pro/Flash
    ↓ response
Cloud Run Backend
    ↓ JSON response (per OpenAPI spec)
Extension (displays suggestion)
```

**Environment Variables Required:**
```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
VERTEX_AI_LOCATION=us-central1

# Model Configuration
GEMINI_MODEL=gemini-1.5-pro  # or gemini-1.5-flash

# Security
API_KEY_SECRET_NAME=support-chat-ai-api-key

# Storage
FIRESTORE_COLLECTION=suggestions

# CORS (Chrome Extension ID)
ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Environment
ENVIRONMENT=production
DEBUG=false
```

### Considerations & Challenges

**1. Vertex AI Authentication**
- **Challenge**: Service account credentials needed for Cloud Run
- **Solution**: Use workload identity or service account JSON
- **Required IAM Roles**: `roles/aiplatform.user`

**2. CORS for Chrome Extension**
- **Challenge**: Extension ID unknown until first build
- **Solution**: Use wildcard for dev, specific ID for production
- **Pattern**: `chrome-extension://[a-z]{32}`

**3. Rate Limiting**
- **Challenge**: Prevent abuse from extension
- **Solution**: Implement per-IP or per-API-key rate limiting (60/min per OpenAPI spec)
- **Library**: Use `slowapi` or custom middleware

**4. Cost Optimization**
- **Challenge**: Gemini API costs per request
- **Solution**:
  - Use Gemini 1.5 Flash (cheaper) for Suggestion Mode
  - Use Gemini 1.5 Pro for YOLO Mode (higher accuracy needed)
  - Implement response caching for common queries

**5. Latency Requirements**
- **Challenge**: Users expect <2 second responses
- **Solution**:
  - Use Cloud Run min instances = 1 to avoid cold starts
  - Implement streaming responses (optional)
  - Monitor P95 latency

**6. Privacy & Data Retention**
- **Challenge**: Customer data must not be stored permanently
- **Solution**:
  - Process conversation context in-memory only
  - Store only metadata in Firestore (no customer messages)
  - Implement TTL (7 days) for analytics

**7. YOLO Mode Safety**
- **Challenge**: Autonomous responses require safety checks
- **Solution**:
  - Implement confidence threshold checks (min 0.7 per OpenAPI spec)
  - Keyword-based escalation detection
  - Maximum conversation turn limits
  - All safety logic in backend for consistency

**8. OpenAPI Compliance**
- **Challenge**: Ensure implementation exactly matches OpenAPI specification
- **Solution**:
  - Use `docs/api-spec.yaml` as source of truth for all endpoints
  - Validate request/response schemas against spec
  - Use FastAPI's automatic OpenAPI generation and compare with spec
  - Test all endpoints against spec examples

## 📝 Implementation Plan

### Prerequisites

1. **GCP Project Setup**
   ```bash
   # Create GCP project (if not exists)
   gcloud projects create support-chat-ai --name="Support Chat AI"
   gcloud config set project support-chat-ai

   # Enable required APIs
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com

   # Create Artifact Registry repository
   gcloud artifacts repositories create support-chat-ai \
     --repository-format=docker \
     --location=us-central1
   ```

2. **Local Development Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-dev.txt

   # Authenticate with GCP
   gcloud auth application-default login

   # Copy environment template
   cp .env.example .env
   # Edit .env with your GCP_PROJECT_ID
   ```

3. **Install Additional Dependencies**
   ```bash
   # Add to requirements.txt
   pip install slowapi  # Rate limiting
   pip install prometheus-client  # Metrics
   ```

### Step-by-Step Implementation

#### **Phase 1: Core Backend Services (2-3 hours)**

**Step 1: Implement Vertex AI Gemini Service**
- Files to create: `backend/app/services/gemini.py`
- **Reference**: OpenAPI spec `docs/api-spec.yaml` - see Metadata schema for model_used field
- Changes needed:
  ```python
  # Initialize Vertex AI client
  # Implement generate_suggestion(prompt: str) -> str
  # Implement generate_autonomous_response(prompt: str, goal: dict) -> dict
  # Handle retries and error cases
  # Support both Gemini 1.5 Pro and Flash models (per OpenAPI spec)
  ```
- Key functions:
  - `initialize_vertex_ai()` - Set up Vertex AI client
  - `generate_text_async(prompt: str, model: str)` - Call Gemini API
  - `calculate_confidence(response: str)` - Heuristic confidence score (0.0-1.0 per OpenAPI spec)
  - `handle_vertex_ai_error(error: Exception)` - Error handling (return 503 per OpenAPI spec)

**Step 2: Implement Prompt Builder Service**
- Files to create: `backend/app/services/prompt_builder.py`
- **Reference**: OpenAPI spec UserPreferences schema (tone, length, language, always_include_greeting)
- Changes needed:
  ```python
  # Build prompts for Suggestion Mode
  # Build prompts for YOLO Mode with goals
  # Include conversation context
  # Apply user preferences (tone, length) from UserPreferences schema
  # Add system instructions for safety
  ```
- Key functions:
  - `build_suggestion_prompt(context: List[Message], prefs: UserPreferences)` - Suggestion Mode
  - `build_autonomous_prompt(context: List[Message], goal: Goal, state: GoalState)` - YOLO Mode
  - `format_conversation(messages: List[Message])` - Format messages per Message schema
  - `apply_tone(prompt: str, tone: str)` - Apply tone preferences (professional/casual/friendly/empathetic)

**Step 3: Implement Context Processor Service**
- Files to create: `backend/app/services/context_processor.py`
- **Reference**: OpenAPI spec Message schema (role, content, timestamp validation)
- Changes needed:
  ```python
  # Validate conversation context
  # Clean and sanitize messages
  # Detect conversation intent
  # Extract key entities (order numbers, emails)
  # Enforce minItems: 1, maxItems: 50 from OpenAPI spec
  ```
- Key functions:
  - `process_context(messages: List[Message])` - Validate and clean
  - `detect_intent(messages: List[Message])` - Classify conversation type
  - `extract_entities(text: str)` - NER for order numbers, etc.

#### **Phase 2: API Endpoints (2-3 hours)**

**Step 4: Create Suggestion Mode API Endpoint**
- Files to create: `backend/app/api/routes/suggest.py`
- **Reference**: OpenAPI spec `/api/suggest-response` endpoint definition
- **Must match**: SuggestRequest schema (input), SuggestResponse schema (output)
- Changes needed:
  ```python
  @router.post("/api/suggest-response", response_model=SuggestResponse)
  async def suggest_response(request: SuggestRequest):
      # 1. Validate request (Pydantic auto-validates against SuggestRequest schema)
      # 2. Process conversation context
      # 3. Build prompt with user preferences
      # 4. Call Vertex AI Gemini (use gemini-1.5-flash per OpenAPI examples)
      # 5. Generate suggestion with confidence score (0.0-1.0)
      # 6. Return SuggestResponse with metadata (request_id, processing_time_ms, model_used, timestamp)
  ```
- Error handling per OpenAPI spec:
  - 400 (bad request - validation error)
  - 401 (missing/invalid API key)
  - 429 (rate limit exceeded - 60/min)
  - 500 (internal error)
  - 503 (Vertex AI unavailable)
- Response time target: <2 seconds (per OpenAPI description)

**Step 5: Create Autonomous Mode API Endpoint**
- Files to create: `backend/app/api/routes/autonomous.py`
- **Reference**: OpenAPI spec `/api/autonomous-response` endpoint definition
- **Must match**: AutonomousRequest schema (input), AutonomousResponse schema (output)
- Changes needed:
  ```python
  @router.post("/api/autonomous-response", response_model=AutonomousResponse)
  async def autonomous_response(request: AutonomousRequest):
      # 1. Validate request and goal state (auto-validated by Pydantic)
      # 2. Check safety constraints (SafetyConstraints schema: max_turns, escalation_keywords, min_confidence)
      # 3. Build goal-oriented prompt
      # 4. Call Vertex AI Gemini (use gemini-1.5-pro per OpenAPI examples)
      # 5. Determine action: "respond" | "escalate" | "goal_complete" (per OpenAPI enum)
      # 6. Update goal state (GoalState schema: active, current_turn, progress)
      # 7. Return AutonomousResponse with action, response_text (nullable), updated_state, reasoning, confidence, metadata
  ```
- **Safety checks per OpenAPI spec**:
  - Enforce max_turns (1-20)
  - Check escalation_keywords array
  - Respect min_confidence threshold (0.0-1.0, default 0.7)
  - stop_if_confused flag

**Step 6: Create Feedback API Endpoint**
- Files to create: `backend/app/api/routes/feedback.py`
- **Reference**: OpenAPI spec `/api/feedback` endpoint definition
- **Must match**: FeedbackRequest schema (input), success response
- Changes needed:
  ```python
  @router.post("/api/feedback")
  async def submit_feedback(feedback: FeedbackRequest):
      # 1. Validate feedback (FeedbackRequest schema: suggestion_id, rating: "helpful"|"not_helpful", optional comment)
      # 2. Store in Firestore with timestamp
      # 3. Return success response: {status: "success", message: "Feedback recorded", feedback_id: "fb_..."}

  # Model already defined in OpenAPI spec - ensure Pydantic model matches
  ```

**Step 7: Create Conversation Logs API Endpoint**
- Files to create: `backend/app/api/routes/logs.py`
- **Reference**: OpenAPI spec `/api/conversation-logs` GET and POST endpoints
- **Must match**: ConversationLogCreate (POST input), ConversationLogMetadata (GET output)
- Changes needed:
  ```python
  @router.get("/api/conversation-logs")
  async def get_logs(
      limit: int = Query(50, ge=1, le=100),  # Per OpenAPI spec: min 1, max 100, default 50
      platform: Optional[str] = Query(None, enum=["zendesk", "intercom", "coinbase", "robinhood"]),
      start_date: Optional[int] = None
  ):
      # 1. Query Firestore for recent logs with filters
      # 2. Filter sensitive data (privacy: no customer message content)
      # 3. Return response: {logs: ConversationLogMetadata[], total: int, page: int}

  @router.post("/api/conversation-logs", status_code=201)
  async def save_log(log: ConversationLogCreate):
      # 1. Validate log (ConversationLogCreate schema: platform, mode, timestamp required)
      # 2. Remove customer message content (privacy requirement from OpenAPI spec)
      # 3. Save metadata only to Firestore
      # 4. Return: {status: "success", log_id: "log_..."}
  ```

**Step 8: Register Routes in Main App**
- Files to modify: `backend/app/main.py`
- **Reference**: OpenAPI spec tags: suggestions, autonomous, feedback, logs, health
- Changes needed:
  ```python
  from app.api.routes import suggest, autonomous, feedback, logs

  app.include_router(suggest.router, prefix="/api", tags=["suggestions"])
  app.include_router(autonomous.router, prefix="/api", tags=["autonomous"])
  app.include_router(feedback.router, prefix="/api", tags=["feedback"])
  app.include_router(logs.router, prefix="/api", tags=["logs"])

  # Ensure FastAPI generates OpenAPI spec at /openapi.json
  # Compare generated spec with docs/api-spec.yaml for consistency
  ```

#### **Phase 3: Security & Infrastructure (1-2 hours)**

**Step 9: Implement Authentication Middleware**
- Files to create: `backend/app/core/security.py`
- **Reference**: OpenAPI spec securitySchemes.ApiKeyAuth (header: X-API-Key)
- Changes needed:
  ```python
  # API key validation per OpenAPI spec
  # Header name MUST be "X-API-Key"
  # Return 401 for missing/invalid key (per OpenAPI error responses)
  # Rate limiting per API key
  # CORS configuration for extension
  ```
- Middleware implementation:
  ```python
  from fastapi import Security, HTTPException
  from fastapi.security import APIKeyHeader

  api_key_header = APIKeyHeader(name="X-API-Key")  # Per OpenAPI spec

  async def verify_api_key(api_key: str = Security(api_key_header)):
      if not is_valid_api_key(api_key):
          raise HTTPException(
              status_code=401,  # Per OpenAPI spec
              detail="Invalid or missing API key"
          )
      return api_key
  ```

**Step 10: Implement Rate Limiting**
- Files to modify: `backend/app/main.py`, create `backend/app/middleware/rate_limit.py`
- **Reference**: OpenAPI spec info.description (rate limiting: 60 requests/minute)
- Changes needed:
  ```python
  from slowapi import Limiter, _rate_limit_exceeded_handler
  from slowapi.util import get_remote_address

  limiter = Limiter(key_func=get_remote_address)
  app.state.limiter = limiter
  app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

  # Apply to routes (60/minute per OpenAPI spec)
  @limiter.limit("60/minute")
  @router.post("/api/suggest-response")
  async def suggest_response(...):
      ...

  # Return 429 error with retry_after field (per OpenAPI Error schema)
  ```

**Step 11: Implement Firestore Integration**
- Files to create: `backend/app/core/database.py`
- **Reference**: OpenAPI spec ConversationLogCreate and ConversationLogMetadata schemas
- Changes needed:
  ```python
  from google.cloud import firestore

  db = firestore.Client()

  async def save_conversation_log(log: dict):
      # Save to Firestore with auto-generated ID
      # Store only metadata (no customer message content per OpenAPI privacy note)
      doc_ref = db.collection('conversation_logs').document()
      doc_ref.set(log)
      return doc_ref.id

  async def get_analytics():
      # Query Firestore for metrics
      # Calculate suggestion acceptance rate
      # Return aggregated data
  ```

#### **Phase 4: Extension Integration (1-2 hours)**

**Step 12: Replace Mock API with Real API Client**
- Files to modify: `extension/src/background/api-client.ts`
- **Reference**: OpenAPI spec endpoints and request/response schemas
- Changes needed:
  ```typescript
  // Add environment variable for API URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://your-cloud-run-url'
  const API_KEY = import.meta.env.VITE_API_KEY

  // Implement per OpenAPI spec: POST /api/suggest-response
  export async function fetchSuggestion(request: SuggestRequest): Promise<SuggestResponse> {
    const response = await fetch(`${API_URL}/api/suggest-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY  // Per OpenAPI securitySchemes
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      // Handle errors per OpenAPI spec: 400, 401, 429, 500, 503
      throw new APIError(`API error: ${response.status}`)
    }

    return await response.json()  // Returns SuggestResponse schema
  }

  // Implement per OpenAPI spec: POST /api/autonomous-response
  export async function fetchAutonomousResponse(request: AutonomousRequest): Promise<AutonomousResponse> {
    const response = await fetch(`${API_URL}/api/autonomous-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new APIError(`API error: ${response.status}`)
    }

    return await response.json()  // Returns AutonomousResponse schema
  }
  ```

**Step 13: Add Environment Configuration**
- Files to create: `extension/.env.example`, modify `extension/vite.config.ts`
- **Reference**: OpenAPI spec servers (production and local dev URLs)
- Changes needed:
  ```bash
  # .env.example
  VITE_API_URL=http://localhost:8080  # Local dev per OpenAPI spec
  VITE_API_KEY=your-dev-api-key
  ```
  ```typescript
  // vite.config.ts
  export default defineConfig({
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
      'import.meta.env.VITE_API_KEY': JSON.stringify(process.env.VITE_API_KEY)
    }
  })
  ```

**Step 14: Update Mock API to Fallback Mode**
- Files to modify: `extension/src/lib/mock-api.ts`
- Changes needed:
  ```typescript
  // Keep mock API as fallback if backend is unavailable
  export async function getSuggestionWithFallback(request: SuggestRequest): Promise<SuggestResponse> {
    try {
      // Try real API first
      return await fetchSuggestion(request)
    } catch (error) {
      console.warn('Backend unavailable, using mock API', error)
      // Fall back to mock (generates response matching SuggestResponse schema)
      return await generateMockSuggestion(request)
    }
  }
  ```

#### **Phase 5: Deployment (2-3 hours)**

**Step 15: Create Dockerfile**
- Files to verify: `backend/Dockerfile` (already exists)
- Ensure it contains:
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY ./app ./app
  CMD exec gunicorn app.main:app \
      --bind 0.0.0.0:8080 \
      --workers 1 \
      --threads 8 \
      --worker-class uvicorn.workers.UvicornWorker
  ```

**Step 16: Deploy to Cloud Run**
- Terminal commands:
  ```bash
  # Set project
  export PROJECT_ID=your-project-id
  gcloud config set project $PROJECT_ID

  # Build Docker image
  cd backend
  docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:v1.0.0 .

  # Push to Artifact Registry
  gcloud auth configure-docker us-central1-docker.pkg.dev
  docker push us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:v1.0.0

  # Deploy to Cloud Run (production URL per OpenAPI spec servers)
  gcloud run deploy support-chat-ai \
    --image=us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:v1.0.0 \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,ENVIRONMENT=production,GEMINI_MODEL=gemini-1.5-flash" \
    --min-instances=1 \
    --max-instances=10 \
    --memory=1Gi \
    --cpu=1

  # Get deployed URL (update OpenAPI spec servers with actual URL)
  gcloud run services describe support-chat-ai \
    --region=us-central1 \
    --format='value(status.url)'
  ```

**Step 17: Configure Secrets**
- Terminal commands:
  ```bash
  # Create API key secret
  echo -n "your-secure-api-key" | \
    gcloud secrets create support-chat-ai-api-key --data-file=-

  # Grant Cloud Run access to secret
  gcloud secrets add-iam-policy-binding support-chat-ai-api-key \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

  # Update Cloud Run to use secret
  gcloud run services update support-chat-ai \
    --region=us-central1 \
    --update-secrets=API_KEY=support-chat-ai-api-key:latest
  ```

**Step 18: Update Extension with Production URL**
- Files to modify: `extension/.env.production`
- **Reference**: OpenAPI spec servers.url (production)
- Changes needed:
  ```bash
  VITE_API_URL=https://support-chat-ai-XXXXX-uc.a.run.app  # Actual Cloud Run URL
  VITE_API_KEY=your-production-api-key
  ```

#### **Phase 6: Testing & Validation (2-3 hours)**

**Step 19: Test Backend Endpoints Locally**
- **Reference**: Use example requests from OpenAPI spec for testing
- Terminal commands:
  ```bash
  # Start local server
  cd backend
  uvicorn app.main:app --reload --port 8080

  # Test health check (per OpenAPI spec /health endpoint)
  curl http://localhost:8080/health

  # Test suggestion endpoint (use example from OpenAPI spec)
  curl -X POST http://localhost:8080/api/suggest-response \
    -H "Content-Type: application/json" \
    -H "X-API-Key: test-key" \
    -d '{
      "platform": "zendesk",
      "conversation_context": [
        {
          "role": "customer",
          "content": "My order is late",
          "timestamp": 1704067200
        }
      ]
    }'

  # Verify response matches SuggestResponse schema from OpenAPI spec
  ```

**Step 20: Write Backend Tests**
- Files to create: `backend/tests/test_suggest.py`, `backend/tests/test_autonomous.py`
- **Reference**: Use OpenAPI spec examples as test cases
- Changes needed:
  ```python
  import pytest
  from fastapi.testclient import TestClient
  from app.main import app

  client = TestClient(app)

  def test_suggest_response():
      # Use example from OpenAPI spec: /api/suggest-response > examples > basic
      response = client.post("/api/suggest-response", json={
          "platform": "zendesk",
          "conversation_context": [{
              "role": "customer",
              "content": "My order #12345 hasn't arrived yet. It's been 2 weeks!",
              "timestamp": 1704067200
          }],
          "user_preferences": {
              "tone": "professional",
              "length": "medium",
              "language": "en",
              "always_include_greeting": True
          }
      })
      assert response.status_code == 200
      data = response.json()
      # Validate against SuggestResponse schema
      assert "suggestions" in data
      assert len(data["suggestions"]) >= 1
      assert "metadata" in data
      assert data["metadata"]["model_used"] in ["gemini-1.5-pro", "gemini-1.5-flash"]

  def test_autonomous_response():
      # Use example from OpenAPI spec: /api/autonomous-response > examples > resolve_issue
      response = client.post("/api/autonomous-response", json={
          "platform": "zendesk",
          "conversation_context": [{
              "role": "customer",
              "content": "My order is late",
              "timestamp": 1704067200
          }],
          "goal": {
              "type": "resolve_issue",
              "description": "Resolve shipping delay complaint",
              "max_turns": 5
          },
          "goal_state": {
              "active": True,
              "current_turn": 1,
              "progress": 0.2
          },
          "safety_constraints": {
              "max_turns": 5,
              "escalation_keywords": ["angry", "manager", "complaint", "refund"],
              "stop_if_confused": True,
              "min_confidence": 0.7
          }
      })
      assert response.status_code == 200
      data = response.json()
      # Validate against AutonomousResponse schema
      assert data["action"] in ["respond", "escalate", "goal_complete"]
      assert "updated_state" in data
      assert "confidence" in data
      assert 0.0 <= data["confidence"] <= 1.0
  ```

**Step 21: Validate Against OpenAPI Spec**
- **New step**: Ensure implementation matches OpenAPI specification exactly
- Tools and commands:
  ```bash
  # Install OpenAPI validator
  npm install -g @stoplight/spectral-cli

  # Validate spec itself
  spectral lint docs/api-spec.yaml

  # Test backend generates matching OpenAPI spec
  # 1. Start backend server
  uvicorn app.main:app --reload --port 8080

  # 2. Fetch generated OpenAPI spec
  curl http://localhost:8080/openapi.json > /tmp/generated-openapi.json

  # 3. Compare with docs/api-spec.yaml
  # Ensure schemas match (request/response models)
  # Ensure endpoints match (paths, methods, parameters)
  ```

**Step 22: End-to-End Testing**
- Steps:
  1. Load extension in Chrome with production API URL
  2. Navigate to Coinbase/Robinhood chat page
  3. Test Suggestion Mode with real AI responses
  4. Test YOLO Mode with autonomous responses
  5. Verify emergency stop works
  6. Test with invalid API key (should return 401 per OpenAPI spec)
  7. Test rate limiting (should return 429 after 60 requests/min per OpenAPI spec)
  8. Monitor Cloud Run logs for errors

**Step 23: Performance Testing**
- Terminal commands:
  ```bash
  # Install Apache Bench
  # macOS: brew install apache2

  # Test suggestion endpoint (target: <2 seconds per OpenAPI description)
  ab -n 100 -c 10 -T 'application/json' \
    -H "X-API-Key: test-key" \
    -p request.json \
    https://your-cloud-run-url/api/suggest-response

  # Check Cloud Run metrics
  gcloud run services describe support-chat-ai \
    --region=us-central1 \
    --format="value(status.url)"

  # Monitor logs
  gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=support-chat-ai" \
    --limit=50
  ```

### Testing Strategy

**Unit Tests (Backend):**
- Test each service function independently
- Mock Vertex AI responses
- Test error handling and edge cases
- Target: 80%+ code coverage

**Integration Tests (Backend):**
- Test API endpoints end-to-end
- Use test Vertex AI model
- Test with various conversation contexts
- Verify response format matches OpenAPI schemas

**Schema Validation Tests:**
- Validate all request payloads against OpenAPI spec schemas
- Validate all response payloads against OpenAPI spec schemas
- Test error responses match OpenAPI error schema (400, 401, 429, 500, 503)

**E2E Tests (Extension + Backend):**
- Load extension in test browser
- Navigate to real chat platform
- Trigger suggestion generation
- Verify suggestion appears in UI
- Test autonomous mode flow
- Test error scenarios (API down, rate limit)

**Performance Tests:**
- Measure P50, P95, P99 latency (target: P95 < 2s per OpenAPI spec)
- Test with concurrent requests
- Verify Cloud Run auto-scaling
- Monitor Vertex AI quota usage

**Manual Testing Checklist:**
- [ ] Health check returns 200 with correct schema
- [ ] Suggestion endpoint returns valid SuggestResponse
- [ ] Autonomous endpoint returns valid AutonomousResponse
- [ ] Invalid API key returns 401 (per OpenAPI spec)
- [ ] Missing API key returns 401 (per OpenAPI spec)
- [ ] Rate limit triggers after 60 requests/minute (returns 429 per OpenAPI spec)
- [ ] Extension displays real AI suggestions
- [ ] YOLO mode works end-to-end
- [ ] Emergency stop halts YOLO mode
- [ ] Conversation logs saved to Firestore (metadata only)
- [ ] No customer data stored permanently (privacy per OpenAPI spec)
- [ ] All responses include required metadata fields (request_id, processing_time_ms, model_used, timestamp)

## 🎯 Success Criteria

**Backend:**
- ✅ All API endpoints return 2xx responses
- ✅ All endpoints match OpenAPI spec exactly (paths, methods, schemas)
- ✅ Vertex AI successfully generates suggestions
- ✅ Response latency P95 < 2 seconds
- ✅ Rate limiting prevents abuse (60 req/min per OpenAPI spec)
- ✅ No customer data stored (only metadata per OpenAPI privacy notes)
- ✅ Deployed to Cloud Run with auto-scaling
- ✅ Logs visible in Cloud Logging
- ✅ Tests passing with 80%+ coverage
- ✅ Generated OpenAPI spec matches docs/api-spec.yaml

**Extension Integration:**
- ✅ Extension successfully calls backend API
- ✅ Real AI suggestions displayed in UI
- ✅ Fallback to mock API when backend unavailable
- ✅ API key securely stored and transmitted (X-API-Key header per OpenAPI spec)
- ✅ Error handling for network failures
- ✅ YOLO mode works with real AI decisions

**Security:**
- ✅ API key authentication required (X-API-Key header per OpenAPI spec)
- ✅ CORS restricted to extension origin
- ✅ No secrets in code or logs
- ✅ Rate limiting prevents DoS (60/min per OpenAPI spec)
- ✅ Input validation on all endpoints (Pydantic + OpenAPI schemas)

**Deployment:**
- ✅ Cloud Run service deployed and running
- ✅ Auto-scaling configured (1-10 instances)
- ✅ Environment variables configured
- ✅ Secrets stored in Secret Manager
- ✅ Monitoring and alerting enabled

**Documentation:**
- ✅ API endpoints documented in OpenAPI 3.0 spec (docs/api-spec.yaml)
- ✅ All request/response schemas defined
- ✅ Examples provided for all endpoints
- ✅ Deployment instructions in README
- ✅ Environment variable guide
- ✅ Troubleshooting guide

## 📚 Additional Notes

**OpenAPI Specification Usage:**
- **Source of Truth**: `docs/api-spec.yaml` is the authoritative specification for all API endpoints
- **Implementation Guide**: Use OpenAPI schemas to guide Pydantic model creation
- **Testing Reference**: Use OpenAPI examples as test cases
- **Client Generation**: Can generate TypeScript client code from spec using openapi-generator
- **Validation**: FastAPI automatically generates OpenAPI spec - compare with docs/api-spec.yaml for consistency

**Cost Optimization:**
- Use Gemini 1.5 Flash for Suggestion Mode (10x cheaper than Pro, per OpenAPI metadata.model_used)
- Use Gemini 1.5 Pro only for YOLO Mode (higher accuracy needed, per OpenAPI metadata.model_used)
- Implement response caching for identical requests (5-minute TTL)
- Set Cloud Run min instances=1 to avoid cold starts but limit max=10

**Monitoring:**
- Set up Cloud Monitoring alerts for:
  - Response latency > 3 seconds (target <2s per OpenAPI spec)
  - Error rate > 5%
  - CPU usage > 80%
  - Request rate spike (DDoS detection)

**Future Enhancements:**
- Implement streaming responses for faster perceived performance
- Add response caching with Redis
- Implement A/B testing for different prompts
- Add conversation analytics dashboard
- Support for more Gemini models (Gemini Ultra)
- Implement feedback loop for model fine-tuning
- Generate TypeScript API client from OpenAPI spec for extension
