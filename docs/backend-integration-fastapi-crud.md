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
│   ├── Model: Gemini 2.5 Flash
│   └── Output: Suggestion with confidence score
└── AutonomousAgent (YOLO Mode)
    ├── Sub-agents: GoalPlannerAgent, SafetyCheckerAgent, ResponseGeneratorAgent
    ├── Orchestration: Sequential workflow with LLM routing
    ├── Tools: GoalTrackerTool, EscalationDetectorTool, ContextAnalyzerTool
    ├── Model: Gemini 2.5 Pro
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

**Backend Structure (Updated with CORRECT ADK API):**
```
backend/app/
├── main.py                   # FastAPI app entry (✅ basic setup)
├── agents/                   # ADK agents (❌ TO CREATE - NEW!)
│   ├── __init__.py
│   ├── suggestion_agent.py   # TO CREATE: SuggestionAgentService wrapper
│   ├── autonomous_agent.py   # TO CREATE: AutonomousAgentService (multi-agent)
│   └── tools/                # ADK tool functions (Python functions, NOT classes)
│       ├── __init__.py
│       ├── context_tools.py  # TO CREATE: process_conversation_context()
│       ├── goal_tools.py     # TO CREATE: track_goal_progress()
│       └── safety_tools.py   # TO CREATE: check_safety_constraints()
├── api/routes/               # API endpoints (❌ empty)
│   ├── suggest.py            # TO CREATE: POST /api/suggest-response
│   ├── autonomous.py         # TO CREATE: POST /api/autonomous-response
│   ├── feedback.py           # TO CREATE: POST /api/feedback
│   └── logs.py               # TO CREATE: GET/POST /api/conversation-logs
├── services/                 # Business logic (❌ empty)
│   ├── gemini.py             # TO CREATE: GeminiService (coordinates ADK agents)
│   └── analytics.py          # TO CREATE: Track usage metrics (optional)
├── models/                   # Data models (✅ complete)
│   ├── request.py            # SuggestRequest, Message, UserPreferences
│   └── response.py           # SuggestResponse, Suggestion, Metadata
└── core/                     # Core utilities (✅ config only)
    ├── config.py             # Settings management
    ├── security.py           # TO CREATE: Auth & rate limiting
    └── database.py           # TO CREATE: Firestore client
```

**Key Changes from Original Plan:**
- ❌ Removed `orchestration/` directory - not needed with ADK's `sub_agents`
- ✅ Tool files renamed to `*_tools.py` for clarity
- ✅ Tools are Python functions, not classes
- ✅ Agent files contain service wrapper classes (`SuggestionAgentService`, `AutonomousAgentService`)

**Documentation Structure:**
```
docs/
└── api-spec.yaml             # ✅ OpenAPI 3.0 specification (919 lines)
```

### Dependencies & Integration Points

**Required GCP Services:**
1. **Vertex AI** - Gemini 2.5 Pro/Flash for response generation (via ADK)
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
Vertex AI Gemini 2.5 Pro/Flash
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
GEMINI_MODEL=gemini-2.5-pro  # or gemini-2.5-flash
GEMINI_FLASH_MODEL=gemini-2.5-flash  # for Suggestion Mode
GEMINI_PRO_MODEL=gemini-2.5-pro      # for YOLO Mode

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
  - Use Gemini 2.5 Flash (cheaper) for Suggestion Mode via ADK
  - Use Gemini 2.5 Pro for YOLO Mode (higher accuracy needed) via ADK
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

**⚠️ IMPORTANT: ADK API Corrections Applied**
This plan has been updated with the CORRECT Google ADK API after verifying the actual package structure:
- ✅ Imports: `from google.adk.agents import Agent, LlmAgent` (NOT `from adk import`)
- ✅ Tools: Python functions with type hints (NOT classes inheriting from Tool)
- ✅ Multi-agent: `LlmAgent` with `sub_agents=[...]` parameter (NOT `SequentialWorkflow`)
- ✅ Models: String like `"gemini-2.5-flash"` (NOT `GenerativeModel` objects)
- ✅ Agent constructor: `Agent(name, model, instruction, description, tools, sub_agents)`

**Step 0.1: Install and Configure Google ADK**
- Files to modify: `backend/requirements.txt`
- Changes needed:
  ```txt
  # Add to requirements.txt
  google-adk  # Agent Development Kit (latest stable from PyPI)
  ```
- Installation:
  ```bash
  pip install google-adk
  # OR with all optional dependencies:
  pip install google-adk[all]
  ```
- Verification:
  ```python
  # Test ADK installation (CORRECT API)
  from google.adk.agents import Agent, LlmAgent
  print("ADK installed successfully!")
  ```
- **Important API Note**: ADK uses `google.adk.agents` namespace, NOT `from adk import`

**Step 0.2: Design ADK Agent Architecture**
- **Reference**: ADK documentation, OpenAPI spec requirements
- **Agent Design**:

  **SuggestionAgent (Suggestion Mode)**:
  ```python
  SuggestionAgent
  ├── Model: Gemini 2.5 Flash
  ├── State: ConversationState (messages, preferences)
  ├── Tools:
  │   ├── ConversationContextTool (extract context)
  │   └── PreferencesTool (apply tone, length, language)
  └── Output: Suggestion (text, confidence)
  ```

  **AutonomousAgent (YOLO Mode - Multi-Agent System)**:
  ```python
  AutonomousAgent (Coordinator using LlmAgent)
  ├── Orchestration: sub_agents parameter (ADK handles delegation)
  ├── Sub-Agents:
  │   ├── GoalPlannerAgent
  │   │   ├── Input: Goal, ConversationState
  │   │   ├── Output: Action plan
  │   │   └── Model: gemini-2.5-pro (string)
  │   ├── SafetyCheckerAgent
  │   │   ├── Input: Action plan, SafetyConstraints
  │   │   ├── Output: Safety decision (safe/escalate)
  │   │   └── Tools: escalation_detector_func, confidence_calculator_func (Python functions)
  │   └── ResponseGeneratorAgent
  │       ├── Input: Action plan (if safe)
  │       ├── Output: Response text
  │       └── Model: gemini-2.5-pro (string)
  ├── Tools (Python functions, not classes):
  │   ├── goal_tracker(goal, state, action) -> GoalState
  │   ├── escalation_detector(message, constraints) -> dict
  │   └── context_analyzer(messages) -> dict
  └── Final Output: AutonomousResponse (action, response_text, updated_state)

  NOTE: ADK uses sub_agents parameter, NOT SequentialWorkflow class
  ```

**Step 0.3: Create ADK Project Structure**
- Files to create:
  ```bash
  mkdir -p backend/app/agents/tools
  touch backend/app/agents/__init__.py
  touch backend/app/agents/suggestion_agent.py
  touch backend/app/agents/autonomous_agent.py
  touch backend/app/agents/tools/__init__.py
  touch backend/app/agents/tools/context_tools.py
  touch backend/app/agents/tools/goal_tools.py
  touch backend/app/agents/tools/safety_tools.py
  ```
- **Note**: No `orchestration/` directory needed - ADK handles orchestration via `sub_agents` parameter

#### **Phase 1: Core Backend Services with ADK (3-4 hours)**

**Step 1: Implement ADK Tools**

**Step 1.1: Create conversation context tool functions**
- Files to create: `backend/app/agents/tools/context_tools.py`
- **Reference**: ADK tools are Python functions with type hints, OpenAPI Message schema
- Changes needed:
  ```python
  from typing import List, Dict
  from app.models.request import Message
  import re

  def process_conversation_context(messages: List[Dict]) -> Dict:
      """
      Process conversation context (ADK tool function)

      Args:
          messages: List of message dicts with role, content, timestamp

      Returns:
          Dict with processed_messages, intent, and extracted entities

      - Validates messages (minItems: 1, maxItems: 50 per OpenAPI spec)
      - Cleans and sanitizes messages
      - Extracts key entities (order numbers, emails)
      - Detects conversation intent
      """
      if not messages or len(messages) > 50:
          return {"error": "Invalid message count", "processed_messages": [], "intent": "unknown", "entities": {}}

      # Clean messages
      processed = []
      entities = {"order_numbers": [], "emails": []}

      for msg in messages:
          content = msg.get("content", "").strip()
          processed.append({
              "role": msg.get("role"),
              "content": content,
              "timestamp": msg.get("timestamp")
          })

          # Extract order numbers (e.g., #12345)
          order_nums = re.findall(r'#\d+', content)
          entities["order_numbers"].extend(order_nums)

          # Extract emails
          emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content)
          entities["emails"].extend(emails)

      # Detect intent (simple keyword matching)
      all_content = " ".join([m["content"] for m in processed]).lower()
      intent = "general_inquiry"
      if any(word in all_content for word in ["order", "shipping", "delivery", "late"]):
          intent = "order_inquiry"
      elif any(word in all_content for word in ["refund", "return", "cancel"]):
          intent = "refund_request"
      elif any(word in all_content for word in ["problem", "issue", "broken", "not working"]):
          intent = "technical_issue"

      return {
          "processed_messages": processed,
          "intent": intent,
          "entities": entities
      }
  ```
- **Note**: ADK tools are regular Python functions, NOT classes

**Step 1.2: Create goal tracking tool functions**
- Files to create: `backend/app/agents/tools/goal_tools.py`
- **Reference**: ADK tools are Python functions, OpenAPI GoalState schema
- Changes needed:
  ```python
  from typing import Dict

  def track_goal_progress(goal: Dict, current_state: Dict, latest_action: str) -> Dict:
      """
      Track YOLO goal progress (ADK tool function)

      Args:
          goal: Dict with type, description, max_turns
          current_state: Dict with active, current_turn, progress
          latest_action: String description of last action taken

      Returns:
          Updated GoalState dict

      - Increments current_turn
      - Calculates progress (0.0-1.0)
      - Checks if max_turns reached
      - Determines if goal is complete
      """
      new_turn = current_state.get("current_turn", 0) + 1
      max_turns = goal.get("max_turns", 10)

      # Calculate progress based on turn count and action keywords
      base_progress = min(new_turn / max_turns, 0.9)

      # Boost progress if certain milestones reached
      if "resolved" in latest_action.lower() or "complete" in latest_action.lower():
          progress = 1.0
      elif "gathering" in latest_action.lower() or "information" in latest_action.lower():
          progress = min(base_progress + 0.2, 0.6)
      else:
          progress = base_progress

      return {
          "active": progress < 1.0 and new_turn < max_turns,
          "current_turn": new_turn,
          "progress": round(progress, 2)
      }
  ```
- **Note**: Returns dict, not Pydantic GoalState object (will be converted in agent)

**Step 1.3: Create safety checking tool functions**
- Files to create: `backend/app/agents/tools/safety_tools.py`
- **Reference**: ADK tools are Python functions, OpenAPI SafetyConstraints schema
- Changes needed:
  ```python
  from typing import Dict, List

  def check_safety_constraints(message: str, constraints: Dict, confidence: float) -> Dict:
      """
      Check safety constraints for escalation (ADK tool function)

      Args:
          message: The message/response text to check
          constraints: Dict with max_turns, escalation_keywords, stop_if_confused, min_confidence
          confidence: Confidence score (0.0-1.0)

      Returns:
          Dict with decision ("safe" or "escalate"), reason, and triggers

      - Checks escalation_keywords array
      - Validates min_confidence threshold (0.0-1.0, default 0.7)
      - Detects negative sentiment
      - Returns escalation decision (safe/escalate) + reason
      """
      triggers = []
      message_lower = message.lower()

      # Check escalation keywords
      escalation_keywords = constraints.get("escalation_keywords", [])
      for keyword in escalation_keywords:
          if keyword.lower() in message_lower:
              triggers.append(f"escalation_keyword:{keyword}")

      # Check confidence threshold
      min_confidence = constraints.get("min_confidence", 0.7)
      if confidence < min_confidence:
          triggers.append(f"low_confidence:{confidence:.2f}<{min_confidence}")

      # Check for confusion indicators
      if constraints.get("stop_if_confused", True):
          confusion_phrases = ["i don't understand", "i'm not sure", "unclear", "confused"]
          if any(phrase in message_lower for phrase in confusion_phrases):
              triggers.append("confusion_detected")

      # Detect negative sentiment (simple keyword-based)
      negative_words = ["angry", "frustrated", "terrible", "awful", "hate", "worst"]
      negative_count = sum(1 for word in negative_words if word in message_lower)
      if negative_count >= 2:
          triggers.append(f"negative_sentiment:{negative_count}_negative_words")

      # Make decision
      if triggers:
          return {
              "decision": "escalate",
              "reason": f"Safety violations detected: {', '.join(triggers)}",
              "triggers": triggers,
              "safe": False
          }
      else:
          return {
              "decision": "safe",
              "reason": "All safety checks passed",
              "triggers": [],
              "safe": True
          }
  ```
- **Note**: Returns dict for ADK agents to process

**Step 2: Implement SuggestionAgent (Suggestion Mode)**
- Files to create: `backend/app/agents/suggestion_agent.py`
- **Reference**: ADK Agent API (CORRECT), OpenAPI SuggestRequest/SuggestResponse schemas
- Changes needed:
  ```python
  from google.adk.agents import Agent
  from app.agents.tools.context_tools import process_conversation_context
  from app.models.request import SuggestRequest, UserPreferences
  from app.models.response import Suggestion
  from typing import Dict
  import os

  class SuggestionAgentService:
      """Wrapper service for ADK Suggestion Agent"""

      def __init__(self, project_id: str, location: str):
          # Set environment variables for ADK
          os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
          os.environ["GOOGLE_CLOUD_REGION"] = location

          # Create ADK Agent (CORRECT API)
          self.agent = Agent(
              name="suggestion_agent",
              model="gemini-2.5-flash",  # Use gemini-2.5-flash (latest)
              instruction="""You are an AI assistant helping customer support agents.
              Generate helpful, empathetic response suggestions for customer inquiries.
              Always maintain a professional yet friendly tone.""",
              description="Generates response suggestions for support agents",
              tools=[process_conversation_context]  # Python function, not class
          )

      async def generate_suggestion(self, request: SuggestRequest) -> Suggestion:
          """
          Generate suggestion with ADK
          1. Process conversation context with tool
          2. Build prompt with user preferences (tone, length, language)
          3. Let ADK agent handle tool calling and generation
          4. Return Suggestion object
          """
          # Build user message with context and preferences
          user_message = self._build_prompt(request)

          # ADK agent call (simplified API - agent handles tool calling automatically)
          # Note: Actual ADK API may vary - this is based on documentation patterns
          response_text = await self._call_agent(user_message)

          # Calculate confidence (heuristic based on response characteristics)
          confidence = self._calculate_confidence(response_text)

          return Suggestion(
              text=response_text,
              confidence=confidence,
              reasoning="Generated based on conversation context and user preferences"
          )

      def _build_prompt(self, request: SuggestRequest) -> str:
          """Build prompt with preferences (tone, length, language, always_include_greeting)"""
          prefs = request.user_preferences or {}

          # Format conversation history
          messages_text = "\n".join([
              f"{msg.role.upper()}: {msg.content}"
              for msg in request.conversation_context
          ])

          tone = prefs.get("tone", "professional")
          length = prefs.get("length", "medium")
          language = prefs.get("language", "en")
          include_greeting = prefs.get("always_include_greeting", False)

          prompt = f"""Generate a {tone} customer support response in {language}.

Conversation history:
{messages_text}

Requirements:
- Tone: {tone}
- Length: {length}
- Language: {language}
- Include greeting: {include_greeting}

Provide a helpful, empathetic response that addresses the customer's concern."""

          return prompt

      async def _call_agent(self, message: str) -> str:
          """Call ADK agent - placeholder for actual ADK invocation"""
          # TODO: Implement actual ADK agent invocation when API is confirmed
          # This might be something like: await self.agent.run(message)
          # For now, return placeholder
          return f"[ADK Agent Response to: {message[:50]}...]"

      def _calculate_confidence(self, response: str) -> float:
          """Heuristic confidence score (0.0-1.0 per OpenAPI spec)"""
          # Simple heuristic: longer, more detailed responses = higher confidence
          if len(response) < 20:
              return 0.5
          elif len(response) < 100:
              return 0.7
          elif len(response) < 200:
              return 0.85
          else:
              return 0.9
  ```
- **IMPORTANT**: ADK Agent API uses `Agent(name, model, instruction, description, tools)`
- **Tools are Python functions**, not class instances
- **Model is a string** like "gemini-2.5-flash", NOT GenerativeModel object

**Step 3: Implement AutonomousAgent (YOLO Mode - Multi-Agent)**
- Files to create: `backend/app/agents/autonomous_agent.py`
- **Reference**: ADK multi-agent API (CORRECT with sub_agents), OpenAPI AutonomousRequest/AutonomousResponse schemas
- Changes needed:
  ```python
  from google.adk.agents import Agent, LlmAgent
  from app.agents.tools.goal_tools import track_goal_progress
  from app.agents.tools.safety_tools import check_safety_constraints
  from app.models.request import AutonomousRequest, Goal, GoalState, SafetyConstraints
  from app.models.response import AutonomousResponse
  import os

  class AutonomousAgentService:
      """Multi-agent service for YOLO Mode using ADK (CORRECT API)"""

      def __init__(self, project_id: str, location: str):
          # Set environment variables for ADK
          os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
          os.environ["GOOGLE_CLOUD_REGION"] = location

          # Create sub-agents (CORRECT: use Agent, not classes inheriting from Agent)
          self.goal_planner = Agent(
              name="goal_planner",
              model="gemini-2.5-pro",
              instruction="Analyze the conversation goal and plan the next action to achieve it.",
              description="Plans actions based on conversation goals",
              tools=[track_goal_progress]
          )

          self.safety_checker = Agent(
              name="safety_checker",
              model="gemini-2.5-pro",
              instruction="Check if the proposed response meets safety constraints and escalation rules.",
              description="Validates safety constraints before responding",
              tools=[check_safety_constraints]
          )

          self.response_generator = Agent(
              name="response_generator",
              model="gemini-2.5-pro",
              instruction="Generate an appropriate customer support response based on the approved action plan.",
              description="Generates customer responses"
          )

          # Create coordinator agent with sub_agents (CORRECT API)
          self.coordinator = LlmAgent(
              name="yolo_coordinator",
              model="gemini-2.5-pro",
              instruction="""You coordinate autonomous customer support responses.
              Delegate to specialized agents: goal_planner, safety_checker, response_generator.
              Make decisions about escalation, goal completion, or continuing the conversation.""",
              description="Coordinates multi-agent YOLO mode workflow",
              sub_agents=[self.goal_planner, self.safety_checker, self.response_generator]
          )

      async def process(self, request: AutonomousRequest) -> AutonomousResponse:
          """
          Process autonomous request with multi-agent workflow (ADK handles delegation)
          1. Coordinator delegates to goal_planner, safety_checker, response_generator
          2. ADK orchestrates sub-agent interactions
          3. Return AutonomousResponse with action decision
          """
          # Build input message for coordinator
          user_message = self._build_coordinator_message(request)

          # ADK coordinator handles multi-agent delegation automatically
          # TODO: Implement actual ADK coordinator invocation
          response_text = await self._call_coordinator(user_message, request)

          # Parse coordinator response to determine action
          action_decision = self._parse_action(response_text, request)

          return action_decision

      def _build_coordinator_message(self, request: AutonomousRequest) -> str:
          """Build message for coordinator agent"""
          messages_text = "\n".join([
              f"{msg.role.upper()}: {msg.content}"
              for msg in request.conversation_context
          ])

          goal = request.goal
          state = request.goal_state
          constraints = request.safety_constraints

          return f"""Autonomous support agent task:

Goal: {goal.description} (Type: {goal.type}, Max turns: {goal.max_turns})

Current State:
- Turn: {state.current_turn}/{goal.max_turns}
- Progress: {state.progress:.1%}
- Active: {state.active}

Safety Constraints:
- Min confidence: {constraints.min_confidence}
- Escalation keywords: {', '.join(constraints.escalation_keywords)}
- Stop if confused: {constraints.stop_if_confused}

Conversation:
{messages_text}

Decide the next action: respond, escalate, or goal_complete."""

      async def _call_coordinator(self, message: str, request: AutonomousRequest) -> str:
          """Call ADK coordinator agent - placeholder"""
          # TODO: Implement actual ADK coordinator invocation
          # This might be: await self.coordinator.run(message)
          return "[ADK Coordinator Response]"

      def _parse_action(self, response_text: str, request: AutonomousRequest) -> AutonomousResponse:
          """Parse coordinator response to AutonomousResponse"""
          import time
          import uuid

          # Simple parsing logic (placeholder - will be replaced with actual ADK output parsing)
          if "escalate" in response_text.lower():
              action = "escalate"
              response_text_final = None
          elif "complete" in response_text.lower():
              action = "goal_complete"
              response_text_final = response_text
          else:
              action = "respond"
              response_text_final = response_text

          # Update goal state
          updated_state = GoalState(
              active=action == "respond",
              current_turn=request.goal_state.current_turn + 1,
              progress=min(request.goal_state.progress + 0.1, 1.0)
          )

          return AutonomousResponse(
              action=action,
              response_text=response_text_final,
              updated_state=updated_state,
              reasoning=f"Coordinator decision: {action}",
              confidence=0.8,
              metadata={
                  "request_id": str(uuid.uuid4()),
                  "processing_time_ms": 1500,
                  "model_used": "gemini-2.5-pro",
                  "timestamp": int(time.time())
              }
          )
  ```
- **IMPORTANT**: ADK LlmAgent with `sub_agents` handles delegation automatically
- **NO manual workflow orchestration** needed - coordinator agent decides which sub-agents to call

**Step 4: Implement Gemini Service (ADK-Compatible)**
- Files to create: `backend/app/services/gemini.py`
- **Reference**: ADK integration, OpenAPI Metadata schema
- Changes needed:
  ```python
  from app.core.config import settings
  from app.agents.suggestion_agent import SuggestionAgentService
  from app.agents.autonomous_agent import AutonomousAgentService
  from app.models.request import SuggestRequest, AutonomousRequest
  from app.models.response import Suggestion, AutonomousResponse

  class GeminiService:
      """Service layer for ADK agents"""

      def __init__(self):
          # Initialize ADK agent services (CORRECTED)
          self.suggestion_agent = SuggestionAgentService(
              project_id=settings.GCP_PROJECT_ID,
              location=settings.VERTEX_AI_LOCATION
          )

          self.autonomous_agent = AutonomousAgentService(
              project_id=settings.GCP_PROJECT_ID,
              location=settings.VERTEX_AI_LOCATION
          )

      async def generate_suggestion(self, request: SuggestRequest) -> Suggestion:
          """Generate suggestion using SuggestionAgentService"""
          return await self.suggestion_agent.generate_suggestion(request)

      async def generate_autonomous_response(self, request: AutonomousRequest) -> AutonomousResponse:
          """Generate autonomous response using AutonomousAgentService"""
          return await self.autonomous_agent.process(request)
  ```
- **Note**: No vertexai.init() needed - ADK agents handle Vertex AI initialization via environment variables

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
    --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,ENVIRONMENT=production,GEMINI_MODEL=gemini-2.5-flash,ADK_ENABLE_TRACING=true" \
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
      assert data["metadata"]["model_used"] == "gemini-2.5-flash"

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
- ✅ **SuggestionAgent uses Gemini 2.5 Flash**
- ✅ **AutonomousAgent uses Gemini 2.5 Pro with multi-agent orchestration**
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
- Use Gemini 2.5 Flash for Suggestion Mode (10x cheaper, via ADK)
- Use Gemini 2.5 Pro only for YOLO Mode (higher accuracy, via ADK)
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
