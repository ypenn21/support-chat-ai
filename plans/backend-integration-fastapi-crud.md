# Feature Implementation Plan: Backend Integration with FastAPI CRUD REST API + Google ADK

## 📋 Todo Checklist
- [ ] Set up backend development environment and dependencies
- [ ] Install and configure Google ADK (Agent Development Kit)
- [ ] Design ADK agent architecture for Suggestion and YOLO modes
- [ ] Implement ADK agents with Gemini integration
- [ ] Implement Vertex AI Gemini service integration (via ADK)
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

### Google ADK Integration Overview

**What is Google ADK?**
Google Agent Development Kit (ADK) is an open-source, code-first Python framework for building, evaluating, and deploying sophisticated AI agents with flexibility and control. Released at Google Cloud NEXT 2025, ADK is the same framework powering agents within Google products like Agentspace and Google Customer Engagement Suite (CES).

**Key ADK Features for This Project:**
1. **Model-Agnostic**: Optimized for Gemini but supports other models via LiteLLM
2. **Flexible Orchestration**: Sequential, Parallel, Loop workflows + LLM-driven dynamic routing
3. **Rich Tool Ecosystem**: Pre-built tools (Search, Code Exec), MCP tools, 3rd-party integrations
4. **Stateful Agents**: Built-in state management for conversation context
5. **Production-Ready**: Powers Google production systems, designed for Cloud Run and Vertex AI Agent Engine
6. **Code-First**: Define agent logic, tools, and orchestration directly in Python

**Why ADK for Support Chat AI?**
- **Stateful Conversation Management**: ADK handles conversation state natively, perfect for multi-turn support chats
- **Tool Integration**: Can integrate with knowledge bases, CRM systems, order management APIs
- **Dynamic Orchestration**: LLM-driven routing enables intelligent decision-making for YOLO mode
- **Production Deployment**: Seamless deployment to Cloud Run (our target platform)
- **Gemini Integration**: Optimized for Vertex AI Gemini models we're already using

**ADK Architecture for Support Chat AI:**
```
Support Chat Extension
    ↓ HTTP POST
FastAPI Backend (Routes Layer)
    ↓ Call ADK Agents
ADK Agent Layer
├── SuggestionAgent (Suggestion Mode)
│   ├── Tools: ConversationContextTool, PreferencesTool
│   ├── Model: Gemini 1.5 Flash
│   └── Output: Suggestion with confidence score
└── AutonomousAgent (YOLO Mode)
    ├── Sub-agents: GoalPlannerAgent, SafetyCheckerAgent, ResponseGeneratorAgent
    ├── Orchestration: Sequential workflow with LLM routing
    ├── Tools: GoalTrackerTool, EscalationDetectorTool, ContextAnalyzerTool
    ├── Model: Gemini 1.5 Pro
    └── Output: Action decision (respond/escalate/complete) + response

Vertex AI Gemini (underlying model)
```

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
2. `POST /api/suggest-response` - Suggestion Mode (SuggestRequest → SuggestResponse) → **Uses SuggestionAgent**
3. `POST /api/autonomous-response` - YOLO Mode (AutonomousRequest → AutonomousResponse) → **Uses AutonomousAgent**
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
- ❌ **Google ADK NOT installed** (will be added to requirements.txt)
- ❌ **ADK agents NOT implemented** (new: `app/agents/` directory)
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
5. `/backend/requirements.txt` - Dependencies including Vertex AI SDK (will add ADK)
6. `/extension/src/background/api-client.ts` - Extension API client (currently using mock)
7. `/extension/src/lib/mock-api.ts` - Mock API implementation to be replaced
8. **`/docs/api-spec.yaml`** - Complete OpenAPI 3.0 specification

### Current Architecture

**Technology Stack:**
- **Backend**: FastAPI 0.109.0, Python 3.11+, Uvicorn, Gunicorn
- **AI Framework**: **Google ADK (Agent Development Kit)** - NEW! 🎉
- **AI Models**: Google Vertex AI SDK 1.71.0, Gemini 1.5 Pro/Flash
- **Validation**: Pydantic 2.5.0
- **GCP Services**: Vertex AI, Secret Manager, Firestore, Cloud Logging
- **Extension**: TypeScript, Chrome Manifest V3
- **API Documentation**: OpenAPI 3.0.3

**Backend Structure (Updated with ADK):**
```
backend/app/
├── main.py                   # FastAPI app entry (✅ basic setup)
├── agents/                   # ADK agents (❌ TO CREATE - NEW!)
│   ├── __init__.py
│   ├── suggestion_agent.py   # TO CREATE: Suggestion Mode agent
│   ├── autonomous_agent.py   # TO CREATE: YOLO Mode multi-agent system
│   ├── tools/                # ADK tools
│   │   ├── __init__.py
│   │   ├── context_tool.py   # TO CREATE: Conversation context processing
│   │   ├── goal_tracker.py   # TO CREATE: Goal state tracking
│   │   └── safety_checker.py # TO CREATE: Escalation detection
│   └── orchestration/        # ADK orchestration workflows
│       ├── __init__.py
│       └── yolo_workflow.py  # TO CREATE: Multi-agent YOLO workflow
├── api/routes/               # API endpoints (❌ empty)
│   ├── suggest.py            # TO CREATE: POST /api/suggest-response (calls SuggestionAgent)
│   ├── autonomous.py         # TO CREATE: POST /api/autonomous-response (calls AutonomousAgent)
│   ├── feedback.py           # TO CREATE: POST /api/feedback
│   └── logs.py               # TO CREATE: GET/POST /api/conversation-logs
├── services/                 # Business logic (❌ empty - SIMPLIFIED WITH ADK)
│   ├── gemini.py             # TO CREATE: Vertex AI integration (via ADK)
│   ├── prompt_builder.py     # TO CREATE: Prompt engineering (ADK-compatible)
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
1. **Vertex AI** - Gemini 1.5 Pro/Flash for response generation (via ADK)
2. **Secret Manager** - Store API keys securely
3. **Firestore** - Store conversation logs and analytics
4. **Cloud Logging** - Application logs
5. **Artifact Registry** - Docker image storage
6. **Cloud Run** - Serverless deployment (ADK-optimized)
7. **Vertex AI Agent Engine** - (Optional) For scaled ADK agent deployment

**Integration Flow (with ADK):**
```
Extension (Content Script)
    ↓ chrome.runtime.sendMessage()
Background Service Worker (api-client.ts)
    ↓ HTTP POST (fetch/axios)
Cloud Run Backend (FastAPI)
    ↓ Route to ADK Agent
ADK Agent Layer (SuggestionAgent / AutonomousAgent)
    ↓ LLM call with tools
Vertex AI Gemini 1.5 Pro/Flash
    ↓ response
ADK Agent (post-processing, safety checks)
    ↓ structured output
FastAPI Route
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
GEMINI_FLASH_MODEL=gemini-1.5-flash  # for Suggestion Mode
GEMINI_PRO_MODEL=gemini-1.5-pro      # for YOLO Mode

# ADK Configuration (NEW!)
ADK_AGENT_DEPLOYMENT=cloud-run  # or vertex-ai-agent-engine
ADK_ENABLE_TRACING=true         # for debugging
ADK_LOG_LEVEL=INFO

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

**1. ADK Integration Strategy**
- **Challenge**: ADK is a new framework, need to design agent architecture carefully
- **Solution**:
  - Start with simple SuggestionAgent (single agent)
  - Build AutonomousAgent as multi-agent system (GoalPlanner → SafetyChecker → ResponseGenerator)
  - Use ADK's Sequential workflow for predictable pipelines
  - Use LLM-driven routing for dynamic YOLO mode decisions
- **Benefit**: ADK handles state management, tool calling, and orchestration automatically

**2. Vertex AI Authentication (via ADK)**
- **Challenge**: Service account credentials needed for Cloud Run
- **Solution**: ADK integrates with Vertex AI automatically using workload identity
- **Required IAM Roles**: `roles/aiplatform.user`

**3. CORS for Chrome Extension**
- **Challenge**: Extension ID unknown until first build
- **Solution**: Use wildcard for dev, specific ID for production
- **Pattern**: `chrome-extension://[a-z]{32}`

**4. Rate Limiting**
- **Challenge**: Prevent abuse from extension
- **Solution**: Implement per-IP or per-API-key rate limiting (60/min per OpenAPI spec)
- **Library**: Use `slowapi` or custom middleware

**5. Cost Optimization (with ADK)**
- **Challenge**: Gemini API costs per request
- **Solution**:
  - Use Gemini 1.5 Flash (cheaper) for Suggestion Mode via ADK
  - Use Gemini 1.5 Pro for YOLO Mode (higher accuracy needed) via ADK
  - Implement response caching for common queries (ADK supports caching)
  - Use ADK's token optimization features

**6. Latency Requirements (ADK Performance)**
- **Challenge**: Users expect <2 second responses
- **Solution**:
  - Use Cloud Run min instances = 1 to avoid cold starts
  - ADK is optimized for production latency
  - Implement streaming responses using ADK (optional)
  - Monitor P95 latency

**7. Privacy & Data Retention**
- **Challenge**: Customer data must not be stored permanently
- **Solution**:
  - Process conversation context in-memory only (ADK stateful agents)
  - Store only metadata in Firestore (no customer messages)
  - Implement TTL (7 days) for analytics
  - ADK state is ephemeral by default

**8. YOLO Mode Safety (ADK Multi-Agent Orchestration)**
- **Challenge**: Autonomous responses require safety checks
- **Solution**:
  - Implement SafetyCheckerAgent as part of AutonomousAgent workflow
  - Use ADK's Sequential orchestration: GoalPlanner → SafetyChecker → ResponseGenerator
  - Confidence threshold checks (min 0.7 per OpenAPI spec)
  - Keyword-based escalation detection via SafetyCheckerAgent
  - Maximum conversation turn limits enforced by GoalTrackerTool
  - All safety logic in backend ADK agents for consistency

**9. OpenAPI Compliance**
- **Challenge**: Ensure implementation exactly matches OpenAPI specification
- **Solution**:
  - Use `docs/api-spec.yaml` as source of truth for all endpoints
  - Validate request/response schemas against spec
  - Use FastAPI's automatic OpenAPI generation and compare with spec
  - Test all endpoints against spec examples

**10. ADK Agent Testing**
- **Challenge**: Testing multi-agent systems is complex
- **Solution**:
  - ADK provides built-in testing utilities
  - Mock ADK tools for unit tests
  - Integration tests with test Gemini model
  - E2E tests with full agent workflows

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

3. **Install Google ADK and Additional Dependencies**
   ```bash
   # Add to requirements.txt
   pip install google-adk  # Google Agent Development Kit
   pip install slowapi  # Rate limiting
   pip install prometheus-client  # Metrics
   ```

### Step-by-Step Implementation

#### **Phase 0: ADK Setup & Architecture Design (1-2 hours) - NEW!**

**Step 0.1: Install and Configure Google ADK**
- Files to modify: `backend/requirements.txt`
- Changes needed:
  ```txt
  # Add to requirements.txt
  google-adk>=0.1.0  # Agent Development Kit
  litellm>=1.0.0     # For multi-model support (ADK dependency)
  ```
- Installation:
  ```bash
  pip install google-adk litellm
  ```
- Verification:
  ```python
  # Test ADK installation
  from adk import Agent, Tool
  print("ADK installed successfully!")
  ```

**Step 0.2: Design ADK Agent Architecture**
- **Reference**: ADK documentation, OpenAPI spec requirements
- **Agent Design**:

  **SuggestionAgent (Suggestion Mode)**:
  ```python
  SuggestionAgent
  ├── Model: Gemini 1.5 Flash
  ├── State: ConversationState (messages, preferences)
  ├── Tools:
  │   ├── ConversationContextTool (extract context)
  │   └── PreferencesTool (apply tone, length, language)
  └── Output: Suggestion (text, confidence)
  ```

  **AutonomousAgent (YOLO Mode - Multi-Agent System)**:
  ```python
  AutonomousAgent (Orchestrator)
  ├── Orchestration: Sequential Workflow
  ├── Sub-Agents:
  │   ├── GoalPlannerAgent
  │   │   ├── Input: Goal, ConversationState
  │   │   ├── Output: Action plan
  │   │   └── Model: Gemini 1.5 Pro
  │   ├── SafetyCheckerAgent
  │   │   ├── Input: Action plan, SafetyConstraints
  │   │   ├── Output: Safety decision (safe/escalate)
  │   │   └── Tools: EscalationDetectorTool, ConfidenceCalculatorTool
  │   └── ResponseGeneratorAgent
  │       ├── Input: Action plan (if safe)
  │       ├── Output: Response text
  │       └── Model: Gemini 1.5 Pro
  ├── Tools:
  │   ├── GoalTrackerTool (track progress, turn count)
  │   ├── EscalationDetectorTool (keywords, sentiment)
  │   └── ContextAnalyzerTool (intent detection)
  └── Final Output: AutonomousResponse (action, response_text, updated_state)
  ```

**Step 0.3: Create ADK Project Structure**
- Files to create:
  ```bash
  mkdir -p backend/app/agents/tools
  mkdir -p backend/app/agents/orchestration
  touch backend/app/agents/__init__.py
  touch backend/app/agents/suggestion_agent.py
  touch backend/app/agents/autonomous_agent.py
  touch backend/app/agents/tools/__init__.py
  touch backend/app/agents/tools/context_tool.py
  touch backend/app/agents/tools/goal_tracker.py
  touch backend/app/agents/tools/safety_checker.py
  touch backend/app/agents/orchestration/__init__.py
  touch backend/app/agents/orchestration/yolo_workflow.py
  ```

#### **Phase 1: Core Backend Services with ADK (3-4 hours)**

**Step 1: Implement ADK Tools**

**Step 1.1: Create ConversationContextTool**
- Files to create: `backend/app/agents/tools/context_tool.py`
- **Reference**: ADK Tool interface, OpenAPI Message schema
- Changes needed:
  ```python
  from adk import Tool
  from typing import List, Dict
  from app.models.request import Message

  class ConversationContextTool(Tool):
      """ADK Tool for processing conversation context"""

      name = "conversation_context"
      description = "Extracts and processes conversation context from messages"

      def run(self, messages: List[Message]) -> Dict:
          """
          Process conversation context
          - Validate messages (minItems: 1, maxItems: 50 per OpenAPI spec)
          - Clean and sanitize messages
          - Extract key entities (order numbers, emails)
          - Detect conversation intent
          """
          # Implementation
          return {
              "processed_messages": [...],
              "intent": "...",
              "entities": {...}
          }
  ```

**Step 1.2: Create GoalTrackerTool**
- Files to create: `backend/app/agents/tools/goal_tracker.py`
- **Reference**: ADK Tool interface, OpenAPI GoalState schema
- Changes needed:
  ```python
  from adk import Tool
  from app.models.request import Goal, GoalState

  class GoalTrackerTool(Tool):
      """ADK Tool for tracking YOLO goal progress"""

      name = "goal_tracker"
      description = "Tracks goal progress and turn count for autonomous mode"

      def run(self, goal: Goal, current_state: GoalState, latest_action: str) -> GoalState:
          """
          Update goal state
          - Increment current_turn
          - Calculate progress (0.0-1.0)
          - Check if max_turns reached
          - Determine if goal is complete
          """
          # Implementation
          return GoalState(...)
  ```

**Step 1.3: Create SafetyCheckerTool**
- Files to create: `backend/app/agents/tools/safety_checker.py`
- **Reference**: ADK Tool interface, OpenAPI SafetyConstraints schema
- Changes needed:
  ```python
  from adk import Tool
  from app.models.request import SafetyConstraints

  class SafetyCheckerTool(Tool):
      """ADK Tool for escalation detection and safety checks"""

      name = "safety_checker"
      description = "Detects escalation triggers and safety violations"

      def run(self,
              message: str,
              constraints: SafetyConstraints,
              confidence: float) -> Dict:
          """
          Check safety constraints
          - Check escalation_keywords array
          - Validate min_confidence threshold (0.0-1.0, default 0.7)
          - Detect negative sentiment
          - Return escalation decision (safe/escalate) + reason
          """
          # Implementation
          return {
              "decision": "safe" | "escalate",
              "reason": "...",
              "triggers": [...]
          }
  ```

**Step 2: Implement SuggestionAgent (Suggestion Mode)**
- Files to create: `backend/app/agents/suggestion_agent.py`
- **Reference**: ADK Agent interface, OpenAPI SuggestRequest/SuggestResponse schemas
- Changes needed:
  ```python
  from adk import Agent
  from vertexai.generative_models import GenerativeModel
  from app.agents.tools.context_tool import ConversationContextTool
  from app.models.request import SuggestRequest, UserPreferences
  from app.models.response import Suggestion

  class SuggestionAgent(Agent):
      """ADK Agent for Suggestion Mode"""

      def __init__(self, project_id: str, location: str):
          super().__init__(
              name="suggestion_agent",
              model=GenerativeModel("gemini-1.5-flash"),  # Per OpenAPI spec
              tools=[ConversationContextTool()],
              project_id=project_id,
              location=location
          )

      async def generate_suggestion(self, request: SuggestRequest) -> Suggestion:
          """
          Generate suggestion with ADK
          1. Use ConversationContextTool to process context
          2. Build prompt with user preferences (tone, length, language)
          3. Call Gemini 1.5 Flash via ADK
          4. Calculate confidence score (0.0-1.0)
          5. Return Suggestion object
          """
          # ADK handles state management and tool calling
          context = await self.use_tool("conversation_context", request.conversation_context)

          prompt = self._build_prompt(context, request.user_preferences)
          response = await self.generate_content(prompt)

          return Suggestion(
              text=response.text,
              confidence=self._calculate_confidence(response),
              reasoning="..."
          )

      def _build_prompt(self, context: Dict, prefs: UserPreferences) -> str:
          """Build prompt with preferences (tone, length, language, always_include_greeting)"""
          # Implementation
          pass

      def _calculate_confidence(self, response) -> float:
          """Heuristic confidence score (0.0-1.0 per OpenAPI spec)"""
          # Implementation
          pass
  ```

**Step 3: Implement AutonomousAgent (YOLO Mode - Multi-Agent)**
- Files to create: `backend/app/agents/autonomous_agent.py`
- **Reference**: ADK multi-agent orchestration, OpenAPI AutonomousRequest/AutonomousResponse schemas
- Changes needed:
  ```python
  from adk import Agent, SequentialWorkflow
  from vertexai.generative_models import GenerativeModel
  from app.agents.tools.goal_tracker import GoalTrackerTool
  from app.agents.tools.safety_checker import SafetyCheckerTool
  from app.models.request import AutonomousRequest, Goal, GoalState, SafetyConstraints
  from app.models.response import AutonomousResponse

  class GoalPlannerAgent(Agent):
      """Sub-agent: Plans action based on goal"""
      def __init__(self, project_id: str, location: str):
          super().__init__(
              name="goal_planner",
              model=GenerativeModel("gemini-1.5-pro"),  # Per OpenAPI spec
              tools=[GoalTrackerTool()],
              project_id=project_id,
              location=location
          )

  class SafetyCheckerAgent(Agent):
      """Sub-agent: Checks safety constraints"""
      def __init__(self, project_id: str, location: str):
          super().__init__(
              name="safety_checker",
              model=GenerativeModel("gemini-1.5-pro"),
              tools=[SafetyCheckerTool()],
              project_id=project_id,
              location=location
          )

  class ResponseGeneratorAgent(Agent):
      """Sub-agent: Generates response if safe"""
      def __init__(self, project_id: str, location: str):
          super().__init__(
              name="response_generator",
              model=GenerativeModel("gemini-1.5-pro"),
              tools=[],
              project_id=project_id,
              location=location
          )

  class AutonomousAgent:
      """Main orchestrator for YOLO Mode using ADK multi-agent workflow"""

      def __init__(self, project_id: str, location: str):
          self.goal_planner = GoalPlannerAgent(project_id, location)
          self.safety_checker = SafetyCheckerAgent(project_id, location)
          self.response_generator = ResponseGeneratorAgent(project_id, location)

          # ADK Sequential Workflow
          self.workflow = SequentialWorkflow(
              agents=[
                  self.goal_planner,
                  self.safety_checker,
                  self.response_generator
              ]
          )

      async def process(self, request: AutonomousRequest) -> AutonomousResponse:
          """
          Process autonomous request with multi-agent workflow
          1. GoalPlannerAgent: Analyze goal and plan action
          2. SafetyCheckerAgent: Check safety constraints
          3. ResponseGeneratorAgent: Generate response (if safe)
          4. Return AutonomousResponse with action decision
          """
          # Step 1: Goal Planning
          action_plan = await self.goal_planner.run({
              "goal": request.goal,
              "context": request.conversation_context,
              "state": request.goal_state
          })

          # Step 2: Safety Check
          safety_result = await self.safety_checker.run({
              "action_plan": action_plan,
              "constraints": request.safety_constraints,
              "confidence": action_plan.get("confidence", 0.5)
          })

          # Step 3: Determine Action
          if safety_result["decision"] == "escalate":
              return AutonomousResponse(
                  action="escalate",
                  response_text=None,
                  updated_state=self._update_state(request.goal_state),
                  reasoning=safety_result["reason"],
                  confidence=safety_result.get("confidence", 0.0),
                  metadata=self._generate_metadata()
              )

          # Step 4: Generate Response
          if action_plan.get("goal_complete"):
              return AutonomousResponse(
                  action="goal_complete",
                  response_text=action_plan["final_message"],
                  updated_state=self._complete_state(request.goal_state),
                  reasoning="Goal achieved",
                  confidence=action_plan["confidence"],
                  metadata=self._generate_metadata()
              )

          response = await self.response_generator.run({
              "action_plan": action_plan,
              "context": request.conversation_context
          })

          return AutonomousResponse(
              action="respond",
              response_text=response.text,
              updated_state=self._update_state(request.goal_state),
              reasoning=response.reasoning,
              confidence=response.confidence,
              metadata=self._generate_metadata()
          )

      def _update_state(self, state: GoalState) -> GoalState:
          """Update goal state (increment turn, update progress)"""
          pass

      def _complete_state(self, state: GoalState) -> GoalState:
          """Mark goal as complete"""
          pass

      def _generate_metadata(self) -> Dict:
          """Generate metadata (request_id, processing_time_ms, model_used, timestamp)"""
          pass
  ```

**Step 4: Implement Gemini Service (ADK-Compatible)**
- Files to create: `backend/app/services/gemini.py`
- **Reference**: ADK Vertex AI integration, OpenAPI Metadata schema
- Changes needed:
  ```python
  import vertexai
  from vertexai.generative_models import GenerativeModel
  from app.core.config import settings
  from app.agents.suggestion_agent import SuggestionAgent
  from app.agents.autonomous_agent import AutonomousAgent

  class GeminiService:
      """Vertex AI Gemini service (ADK-compatible)"""

      def __init__(self):
          vertexai.init(
              project=settings.GCP_PROJECT_ID,
              location=settings.VERTEX_AI_LOCATION
          )

          # Initialize ADK agents
          self.suggestion_agent = SuggestionAgent(
              project_id=settings.GCP_PROJECT_ID,
              location=settings.VERTEX_AI_LOCATION
          )

          self.autonomous_agent = AutonomousAgent(
              project_id=settings.GCP_PROJECT_ID,
              location=settings.VERTEX_AI_LOCATION
          )

      async def generate_suggestion(self, request: SuggestRequest) -> Suggestion:
          """Generate suggestion using SuggestionAgent"""
          return await self.suggestion_agent.generate_suggestion(request)

      async def generate_autonomous_response(self, request: AutonomousRequest) -> AutonomousResponse:
          """Generate autonomous response using AutonomousAgent"""
          return await self.autonomous_agent.process(request)
  ```

#### **Phase 2: API Endpoints (2-3 hours)**

**Step 5: Create Suggestion Mode API Endpoint**
- Files to create: `backend/app/api/routes/suggest.py`
- **Reference**: OpenAPI spec `/api/suggest-response` endpoint definition
- **Must match**: SuggestRequest schema (input), SuggestResponse schema (output)
- Changes needed:
  ```python
  from fastapi import APIRouter, Depends, HTTPException
  from app.models.request import SuggestRequest
  from app.models.response import SuggestResponse, Suggestion, Metadata
  from app.services.gemini import GeminiService
  import time
  import uuid

  router = APIRouter()

  @router.post("/suggest-response", response_model=SuggestResponse)
  async def suggest_response(
      request: SuggestRequest,
      gemini_service: GeminiService = Depends()
  ):
      """
      Generate suggestion using ADK SuggestionAgent
      1. Validate request (Pydantic auto-validates against SuggestRequest schema)
      2. Call GeminiService.generate_suggestion() → uses ADK SuggestionAgent
      3. Return SuggestResponse with metadata
      """
      start_time = time.time()

      try:
          # Call ADK SuggestionAgent
          suggestion = await gemini_service.generate_suggestion(request)

          processing_time = int((time.time() - start_time) * 1000)

          return SuggestResponse(
              suggestions=[suggestion],
              metadata=Metadata(
                  request_id=str(uuid.uuid4()),
                  processing_time_ms=processing_time,
                  model_used="gemini-1.5-flash",  # Per OpenAPI spec
                  timestamp=int(time.time())
              )
          )
      except Exception as e:
          # Error handling per OpenAPI spec
          raise HTTPException(status_code=503, detail="Vertex AI unavailable")
  ```

**Step 6: Create Autonomous Mode API Endpoint**
- Files to create: `backend/app/api/routes/autonomous.py`
- **Reference**: OpenAPI spec `/api/autonomous-response` endpoint definition
- **Must match**: AutonomousRequest schema (input), AutonomousResponse schema (output)
- Changes needed:
  ```python
  from fastapi import APIRouter, Depends, HTTPException
  from app.models.request import AutonomousRequest
  from app.models.response import AutonomousResponse
  from app.services.gemini import GeminiService

  router = APIRouter()

  @router.post("/autonomous-response", response_model=AutonomousResponse)
  async def autonomous_response(
      request: AutonomousRequest,
      gemini_service: GeminiService = Depends()
  ):
      """
      Generate autonomous response using ADK AutonomousAgent (multi-agent)
      1. Validate request and goal state (auto-validated by Pydantic)
      2. Call GeminiService.generate_autonomous_response() → uses ADK AutonomousAgent
      3. Return AutonomousResponse with action decision (respond/escalate/goal_complete)
      """
      try:
          # Call ADK AutonomousAgent (multi-agent workflow)
          response = await gemini_service.generate_autonomous_response(request)
          return response
      except Exception as e:
          raise HTTPException(status_code=503, detail="Vertex AI unavailable")
  ```

**Step 7: Create Feedback API Endpoint**
- Files to create: `backend/app/api/routes/feedback.py`
- **Reference**: OpenAPI spec `/api/feedback` endpoint definition
- **Must match**: FeedbackRequest schema (input), success response
- Changes needed:
  ```python
  from fastapi import APIRouter, Depends
  from app.models.request import FeedbackRequest
  from app.core.database import save_feedback
  import uuid

  router = APIRouter()

  @router.post("/feedback")
  async def submit_feedback(feedback: FeedbackRequest):
      """
      Submit feedback
      1. Validate feedback (FeedbackRequest schema: suggestion_id, rating, optional comment)
      2. Store in Firestore with timestamp
      3. Return success response
      """
      feedback_id = await save_feedback(feedback)
      return {
          "status": "success",
          "message": "Feedback recorded",
          "feedback_id": feedback_id
      }
  ```

**Step 8: Create Conversation Logs API Endpoint**
- Files to create: `backend/app/api/routes/logs.py`
- **Reference**: OpenAPI spec `/api/conversation-logs` GET and POST endpoints
- **Must match**: ConversationLogCreate (POST input), ConversationLogMetadata (GET output)
- Changes needed:
  ```python
  from fastapi import APIRouter, Query
  from typing import Optional, List
  from app.models.request import ConversationLogCreate
  from app.models.response import ConversationLogMetadata
  from app.core.database import get_conversation_logs, save_conversation_log

  router = APIRouter()

  @router.get("/conversation-logs")
  async def get_logs(
      limit: int = Query(50, ge=1, le=100),  # Per OpenAPI spec
      platform: Optional[str] = Query(None, enum=["zendesk", "intercom", "coinbase", "robinhood"]),
      start_date: Optional[int] = None
  ):
      """
      Retrieve conversation logs
      1. Query Firestore for recent logs with filters
      2. Filter sensitive data (privacy: no customer message content)
      3. Return response: {logs: ConversationLogMetadata[], total: int, page: int}
      """
      logs = await get_conversation_logs(limit, platform, start_date)
      return {
          "logs": logs,
          "total": len(logs),
          "page": 1
      }

  @router.post("/conversation-logs", status_code=201)
  async def save_log(log: ConversationLogCreate):
      """
      Save conversation log
      1. Validate log (ConversationLogCreate schema)
      2. Remove customer message content (privacy requirement)
      3. Save metadata only to Firestore
      4. Return: {status: "success", log_id: "log_..."}
      """
      log_id = await save_conversation_log(log)
      return {
          "status": "success",
          "log_id": log_id
      }
  ```

**Step 9: Register Routes in Main App**
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

**Step 10: Implement Authentication Middleware**
- Files to create: `backend/app/core/security.py`
- **Reference**: OpenAPI spec securitySchemes.ApiKeyAuth (header: X-API-Key)
- Changes needed:
  ```python
  from fastapi import Security, HTTPException
  from fastapi.security import APIKeyHeader
  from app.core.config import settings

  api_key_header = APIKeyHeader(name="X-API-Key")  # Per OpenAPI spec

  async def verify_api_key(api_key: str = Security(api_key_header)):
      """Verify API key per OpenAPI spec"""
      if not is_valid_api_key(api_key):
          raise HTTPException(
              status_code=401,  # Per OpenAPI spec
              detail="Invalid or missing API key"
          )
      return api_key

  def is_valid_api_key(api_key: str) -> bool:
      """Check if API key is valid"""
      # Implementation: check against Secret Manager
      pass
  ```

**Step 11: Implement Rate Limiting**
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

**Step 12: Implement Firestore Integration**
- Files to create: `backend/app/core/database.py`
- **Reference**: OpenAPI spec ConversationLogCreate and ConversationLogMetadata schemas
- Changes needed:
  ```python
  from google.cloud import firestore

  db = firestore.Client()

  async def save_conversation_log(log: dict):
      """Save to Firestore (metadata only, no customer message content)"""
      doc_ref = db.collection('conversation_logs').document()
      doc_ref.set(log)
      return doc_ref.id

  async def get_conversation_logs(limit: int, platform: str, start_date: int):
      """Query Firestore for logs"""
      query = db.collection('conversation_logs').limit(limit)
      if platform:
          query = query.where('platform', '==', platform)
      # Execute query and return results
      pass

  async def save_feedback(feedback: FeedbackRequest):
      """Save feedback to Firestore"""
      doc_ref = db.collection('feedback').document()
      doc_ref.set(feedback.dict())
      return f"fb_{doc_ref.id}"
  ```

#### **Phase 4: Extension Integration (1-2 hours)**

**Step 13: Replace Mock API with Real API Client**
- Files to modify: `extension/src/background/api-client.ts`
- **Reference**: OpenAPI spec endpoints and request/response schemas
- Changes needed:
  ```typescript
  const API_URL = import.meta.env.VITE_API_URL || 'https://your-cloud-run-url'
  const API_KEY = import.meta.env.VITE_API_KEY

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

**Step 14: Add Environment Configuration**
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

**Step 15: Update Mock API to Fallback Mode**
- Files to modify: `extension/src/lib/mock-api.ts`
- Changes needed:
  ```typescript
  export async function getSuggestionWithFallback(request: SuggestRequest): Promise<SuggestResponse> {
    try {
      return await fetchSuggestion(request)
    } catch (error) {
      console.warn('Backend unavailable, using mock API', error)
      return await generateMockSuggestion(request)
    }
  }
  ```

#### **Phase 5: Deployment (2-3 hours)**

**Step 16: Update Dockerfile for ADK**
- Files to modify: `backend/Dockerfile`
- Ensure it contains ADK dependencies:
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

**Step 17: Deploy to Cloud Run**
- Terminal commands:
  ```bash
  # Set project
  export PROJECT_ID=your-project-id
  gcloud config set project $PROJECT_ID

  # Build Docker image
  cd backend
  docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:v1.0.0-adk .

  # Push to Artifact Registry
  gcloud auth configure-docker us-central1-docker.pkg.dev
  docker push us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:v1.0.0-adk

  # Deploy to Cloud Run (production URL per OpenAPI spec servers)
  gcloud run deploy support-chat-ai \
    --image=us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:v1.0.0-adk \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,ENVIRONMENT=production,GEMINI_MODEL=gemini-1.5-flash,ADK_ENABLE_TRACING=true" \
    --min-instances=1 \
    --max-instances=10 \
    --memory=1Gi \
    --cpu=1

  # Get deployed URL
  gcloud run services describe support-chat-ai \
    --region=us-central1 \
    --format='value(status.url)'
  ```

**Step 18: Configure Secrets**
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

**Step 19: Update Extension with Production URL**
- Files to modify: `extension/.env.production`
- **Reference**: OpenAPI spec servers.url (production)
- Changes needed:
  ```bash
  VITE_API_URL=https://support-chat-ai-XXXXX-uc.a.run.app  # Actual Cloud Run URL
  VITE_API_KEY=your-production-api-key
  ```

#### **Phase 6: Testing & Validation (2-3 hours)**

**Step 20: Test Backend Endpoints Locally**
- **Reference**: Use example requests from OpenAPI spec for testing
- Terminal commands:
  ```bash
  # Start local server
  cd backend
  uvicorn app.main:app --reload --port 8080

  # Test health check
  curl http://localhost:8080/health

  # Test suggestion endpoint with ADK
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

  # Verify response matches SuggestResponse schema
  ```

**Step 21: Write Backend Tests (with ADK Mocking)**
- Files to create: `backend/tests/test_suggest.py`, `backend/tests/test_autonomous.py`, `backend/tests/test_agents.py`
- **Reference**: Use OpenAPI spec examples as test cases
- Changes needed:
  ```python
  import pytest
  from fastapi.testclient import TestClient
  from app.main import app
  from unittest.mock import Mock, patch

  client = TestClient(app)

  @patch('app.agents.suggestion_agent.SuggestionAgent')
  def test_suggest_response_with_adk(mock_agent):
      """Test suggestion endpoint with mocked ADK agent"""
      # Mock ADK SuggestionAgent
      mock_agent.return_value.generate_suggestion.return_value = Suggestion(
          text="I apologize for the delay...",
          confidence=0.85,
          reasoning="Order delay detected"
      )

      response = client.post("/api/suggest-response", json={
          "platform": "zendesk",
          "conversation_context": [{
              "role": "customer",
              "content": "My order #12345 hasn't arrived yet",
              "timestamp": 1704067200
          }]
      })

      assert response.status_code == 200
      data = response.json()
      assert "suggestions" in data
      assert data["metadata"]["model_used"] == "gemini-1.5-flash"

  @patch('app.agents.autonomous_agent.AutonomousAgent')
  def test_autonomous_response_with_adk(mock_agent):
      """Test autonomous endpoint with mocked ADK multi-agent"""
      # Mock ADK AutonomousAgent
      mock_agent.return_value.process.return_value = AutonomousResponse(
          action="respond",
          response_text="Let me check your order status...",
          updated_state=GoalState(active=True, current_turn=2, progress=0.4),
          reasoning="Gathering order information",
          confidence=0.78,
          metadata={...}
      )

      response = client.post("/api/autonomous-response", json={
          "platform": "zendesk",
          "conversation_context": [{
              "role": "customer",
              "content": "My order is late",
              "timestamp": 1704067200
          }],
          "goal": {
              "type": "resolve_issue",
              "description": "Resolve shipping delay",
              "max_turns": 5
          },
          "goal_state": {
              "active": True,
              "current_turn": 1,
              "progress": 0.2
          },
          "safety_constraints": {
              "max_turns": 5,
              "escalation_keywords": ["angry", "manager"],
              "stop_if_confused": True,
              "min_confidence": 0.7
          }
      })

      assert response.status_code == 200
      data = response.json()
      assert data["action"] in ["respond", "escalate", "goal_complete"]
      assert 0.0 <= data["confidence"] <= 1.0
  ```

**Step 22: Validate Against OpenAPI Spec**
- **Reference**: Ensure implementation matches OpenAPI specification exactly
- Tools and commands:
  ```bash
  # Install OpenAPI validator
  npm install -g @stoplight/spectral-cli

  # Validate spec itself
  spectral lint docs/api-spec.yaml

  # Test backend generates matching OpenAPI spec
  uvicorn app.main:app --reload --port 8080
  curl http://localhost:8080/openapi.json > /tmp/generated-openapi.json

  # Compare schemas
  # Ensure schemas match (request/response models)
  # Ensure endpoints match (paths, methods, parameters)
  ```

**Step 23: End-to-End Testing**
- Steps:
  1. Load extension in Chrome with production API URL
  2. Navigate to Coinbase/Robinhood chat page
  3. Test Suggestion Mode with real ADK-powered AI responses
  4. Test YOLO Mode with ADK multi-agent autonomous responses
  5. Verify emergency stop works
  6. Test with invalid API key (should return 401)
  7. Test rate limiting (should return 429 after 60 requests/min)
  8. Monitor Cloud Run logs for ADK agent activity
  9. Check ADK tracing if enabled (ADK_ENABLE_TRACING=true)

**Step 24: Performance Testing**
- Terminal commands:
  ```bash
  # Test suggestion endpoint (target: <2 seconds)
  ab -n 100 -c 10 -T 'application/json' \
    -H "X-API-Key: test-key" \
    -p request.json \
    https://your-cloud-run-url/api/suggest-response

  # Check Cloud Run metrics
  gcloud run services describe support-chat-ai \
    --region=us-central1 \
    --format="value(status.url)"

  # Monitor logs (look for ADK agent execution times)
  gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=support-chat-ai" \
    --limit=50
  ```

### Testing Strategy

**Unit Tests (Backend):**
- Test each ADK tool independently with mocked inputs
- Test ADK agents with mocked Vertex AI responses
- Test service functions independently
- Test error handling and edge cases
- Target: 80%+ code coverage

**Integration Tests (Backend with ADK):**
- Test API endpoints end-to-end with mocked ADK agents
- Test ADK agent workflows with test Gemini model
- Test with various conversation contexts
- Verify response format matches OpenAPI schemas

**ADK Agent Tests:**
- Test SuggestionAgent with mock ConversationContextTool
- Test AutonomousAgent multi-agent workflow (GoalPlanner → SafetyChecker → ResponseGenerator)
- Test ADK Sequential orchestration
- Test ADK tool calling
- Mock Vertex AI calls for unit tests, use test model for integration tests

**Schema Validation Tests:**
- Validate all request payloads against OpenAPI spec schemas
- Validate all response payloads against OpenAPI spec schemas
- Test error responses match OpenAPI error schema (400, 401, 429, 500, 503)

**E2E Tests (Extension + Backend + ADK):**
- Load extension in test browser
- Navigate to real chat platform
- Trigger suggestion generation (powered by ADK SuggestionAgent)
- Verify suggestion appears in UI
- Test autonomous mode flow (powered by ADK AutonomousAgent multi-agent)
- Test error scenarios (API down, rate limit)

**Performance Tests:**
- Measure P50, P95, P99 latency (target: P95 < 2s per OpenAPI spec)
- Test with concurrent requests
- Verify Cloud Run auto-scaling
- Monitor Vertex AI quota usage
- Monitor ADK agent execution times

**Manual Testing Checklist:**
- [ ] Health check returns 200 with correct schema
- [ ] Suggestion endpoint returns valid SuggestResponse (ADK-powered)
- [ ] Autonomous endpoint returns valid AutonomousResponse (ADK multi-agent)
- [ ] Invalid API key returns 401
- [ ] Missing API key returns 401
- [ ] Rate limit triggers after 60 requests/minute (returns 429)
- [ ] Extension displays real ADK-powered AI suggestions
- [ ] YOLO mode works end-to-end with ADK multi-agent workflow
- [ ] Emergency stop halts YOLO mode
- [ ] Conversation logs saved to Firestore (metadata only)
- [ ] No customer data stored permanently (privacy)
- [ ] All responses include required metadata fields
- [ ] ADK agents execute successfully in production
- [ ] ADK tracing logs visible (if enabled)

## 🎯 Success Criteria

**Backend:**
- ✅ All API endpoints return 2xx responses
- ✅ All endpoints match OpenAPI spec exactly
- ✅ **Google ADK successfully integrated and operational**
- ✅ **ADK SuggestionAgent generates suggestions**
- ✅ **ADK AutonomousAgent multi-agent workflow executes correctly**
- ✅ Vertex AI successfully generates suggestions via ADK
- ✅ Response latency P95 < 2 seconds
- ✅ Rate limiting prevents abuse (60 req/min)
- ✅ No customer data stored (only metadata)
- ✅ Deployed to Cloud Run with auto-scaling
- ✅ Logs visible in Cloud Logging
- ✅ Tests passing with 80%+ coverage
- ✅ Generated OpenAPI spec matches docs/api-spec.yaml

**ADK Integration:**
- ✅ **ADK agents deployed successfully**
- ✅ **SuggestionAgent uses Gemini 1.5 Flash**
- ✅ **AutonomousAgent uses Gemini 1.5 Pro with multi-agent orchestration**
- ✅ **ADK tools (ConversationContextTool, GoalTrackerTool, SafetyCheckerTool) functional**
- ✅ **ADK Sequential workflow executes correctly**
- ✅ **ADK state management works for conversation context**
- ✅ **ADK tracing logs captured (if enabled)**

**Extension Integration:**
- ✅ Extension successfully calls backend API
- ✅ Real ADK-powered AI suggestions displayed in UI
- ✅ Fallback to mock API when backend unavailable
- ✅ API key securely stored and transmitted
- ✅ Error handling for network failures
- ✅ YOLO mode works with real ADK multi-agent decisions

**Security:**
- ✅ API key authentication required (X-API-Key header)
- ✅ CORS restricted to extension origin
- ✅ No secrets in code or logs
- ✅ Rate limiting prevents DoS (60/min)
- ✅ Input validation on all endpoints

**Deployment:**
- ✅ Cloud Run service deployed and running
- ✅ Auto-scaling configured (1-10 instances)
- ✅ Environment variables configured (including ADK settings)
- ✅ Secrets stored in Secret Manager
- ✅ Monitoring and alerting enabled

**Documentation:**
- ✅ API endpoints documented in OpenAPI 3.0 spec
- ✅ **ADK architecture documented**
- ✅ **ADK agent design patterns documented**
- ✅ All request/response schemas defined
- ✅ Examples provided for all endpoints
- ✅ Deployment instructions in README
- ✅ Environment variable guide
- ✅ Troubleshooting guide

## 📚 Additional Notes

**Google ADK Resources:**
- **Official Docs**: https://google.github.io/adk-docs/
- **GitHub**: https://github.com/google/adk-python
- **Examples**: Check ADK documentation for agent examples and best practices
- **Community**: ADK is actively maintained with bi-weekly releases

**ADK Best Practices:**
- Use Sequential workflow for predictable pipelines (YOLO mode safety checks)
- Use LLM-driven routing for dynamic decision-making
- Keep tools focused and single-purpose
- Use ADK's built-in state management for conversation context
- Enable tracing in development for debugging
- Deploy to Cloud Run for cost-effective scaling (ADK is optimized for serverless)

**OpenAPI Specification Usage:**
- **Source of Truth**: `docs/api-spec.yaml` is the authoritative specification
- **Implementation Guide**: Use OpenAPI schemas to guide Pydantic model creation
- **Testing Reference**: Use OpenAPI examples as test cases
- **Client Generation**: Can generate TypeScript client code from spec

**Cost Optimization (with ADK):**
- Use Gemini 1.5 Flash for Suggestion Mode (10x cheaper, via ADK)
- Use Gemini 1.5 Pro only for YOLO Mode (higher accuracy, via ADK)
- Implement response caching for identical requests (ADK supports caching)
- Set Cloud Run min instances=1, max=10
- ADK's token optimization reduces unnecessary LLM calls

**Monitoring:**
- Set up Cloud Monitoring alerts for:
  - Response latency > 3 seconds (target <2s)
  - Error rate > 5%
  - CPU usage > 80%
  - Request rate spike (DDoS detection)
- **ADK-specific monitoring**:
  - Agent execution times
  - Tool invocation frequency
  - Multi-agent workflow success rate

**Future Enhancements:**
- Implement streaming responses for faster perceived performance (ADK supports streaming)
- Add response caching with Redis (ADK-compatible)
- Implement A/B testing for different agent prompts
- Add conversation analytics dashboard
- Support for more Gemini models (Gemini Ultra)
- Implement feedback loop for agent fine-tuning
- Generate TypeScript API client from OpenAPI spec
- **Deploy to Vertex AI Agent Engine for enterprise-scale ADK agents**
- **Integrate with Google MCP (Model Context Protocol) tools via ADK**
- **Add LangChain/LlamaIndex tools to ADK agents**
