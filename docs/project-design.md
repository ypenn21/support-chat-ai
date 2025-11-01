# Support Chat AI Assistant - Project Design

## Project Overview

A Chrome extension that provides AI-powered support automation using GCP Vertex AI Gemini model. The extension monitors support chat interfaces (Zendesk, Intercom, Coinbase, etc.) and operates in two modes:

**TODO** Personal Information such as id (driver license, passport number, SSN), account number, etc.. 

**Suggestion Mode** (Human-in-the-loop): AI generates response suggestions in real-time, which support agents can review, edit, and send.

**YOLO Mode** (Autonomous Agent): AI automatically responds to customer messages based on configurable goals, with human oversight and the ability to intervene at any time.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Chrome Extension                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   Content    │◄────►│  Background  │◄────►│    Popup     │   │
│  │   Scripts    │      │   Service    │      │      UI      │   │
│  │              │      │   Worker     │      │              │   │
│  └──────┬───────┘      └──────┬───────┘      └──────────────┘   │
│         │                     │                                 │
│         │                     │                                 │
└─────────┼─────────────────────┼─────────────────────────────────┘
          │                     │
          │                     │
          ▼                     ▼
    ┌──────────┐          ┌──────────────────────┐
    │ Support  │          │   Backend API        │
    │ Chat UI  │          │  (Cloud Run)         │
    │ (DOM)    │          └──────────┬───────────┘
    └──────────┘                     │
                                     ▼
                            ┌─────────────────────┐
                            │  GCP Vertex AI      │
                            │  Gemini API         │
                            └─────────────────────┘
```

### Component Architecture

```
Chrome Extension
│
├── Manifest V3 Configuration
│
├── Content Scripts (Injected into support chat pages)
│   ├── DOM Observer (Monitor chat messages)
│   ├── Context Extractor (Extract conversation context)
│   ├── UI Injector (Add suggestion/control panel to chat UI)
│   ├── Message Interceptor (Capture user/customer messages)
│   ├── Auto-Responder (YOLO Mode - inject AI responses)
│   └── Safety Monitor (Detect escalation triggers, stop conditions)
│
├── Background Service Worker
│   ├── API Client (Communicate with backend)
│   ├── Authentication Manager (Handle GCP auth)
│   ├── Cache Manager (Store recent suggestions)
│   ├── Message Router (Route between content scripts and popup)
│   ├── Settings Manager (Store user preferences)
│   ├── Mode Controller (Switch between Suggestion/YOLO modes)
│   └── Goal Tracker (Monitor progress toward conversation goals)
│
├── Popup UI
│   ├── Mode Selector (Switch between Suggestion/YOLO modes)
│   ├── Settings Panel (Configure API key, model params)
│   ├── Goal Configuration (Set YOLO mode objectives)
│   ├── Live Monitor (Real-time view of YOLO conversations)
│   ├── History Viewer (View past suggestions/conversations)
│   ├── Status Indicator (Connection status, mode status)
│   ├── Emergency Stop Button (Immediately halt YOLO mode)
│   └── Quick Actions (Enable/disable, clear cache, take over)
│
└── Options Page
    ├── Advanced Settings
    ├── Chat Platform Configuration
    ├── Prompt Templates
    ├── YOLO Mode Configuration
    │   ├── Goal Presets (Resolve issue, Gather info, Escalate)
    │   ├── Safety Rules (Stop conditions, escalation triggers)
    │   └── Response Constraints (Max turns, tone, style)
    └── Autonomous Behavior Settings

Backend API (GCP Cloud Run - FastAPI)
│
├── /api/suggest-response
│   ├── Request Validation (Pydantic)
│   ├── Context Processing
│   ├── Vertex AI Integration
│   └── Response Formatting
│
├── /api/autonomous-response (YOLO Mode)
│   ├── Goal-Oriented Prompt Building
│   ├── Multi-Turn Conversation Management
│   ├── Safety Check (Escalation detection)
│   ├── Vertex AI Integration
│   └── Action Decision (Respond/Escalate/Stop)
│
├── /api/auth
│   └── Token Validation
│
├── /api/feedback
│   └── Log suggestion quality
│
└── /api/conversation-logs
    └── Store YOLO mode conversation transcripts
```

## Technology Stack

### Chrome Extension
- **Framework**: TypeScript + React (for popup/options UI)
- **Build Tool**: Vite with Rollup (optimized for Chrome extensions)
- **Manifest**: Manifest V3
- **State Management**: Zustand (lightweight state management)
- **UI Components**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + React Testing Library

### Backend (GCP Cloud Run)
- **Runtime**: Python 3.11
- **Framework**: FastAPI + Uvicorn
- **Deployment**: Cloud Run (containerized)
- **AI Model**: Vertex AI Gemini 1.5 Pro/Flash
- **Authentication**: Service Account + API Keys
- **Monitoring**: Cloud Logging + Cloud Monitoring

### Infrastructure
- **Cloud Provider**: Google Cloud Platform
- **API Management**: Cloud Endpoints (optional)
- **Secrets**: Secret Manager
- **Storage**: Firestore (for feedback/analytics)
- **CI/CD**: Cloud Build

## Data Flow

### Mode 1: Suggestion Flow (Human-in-the-Loop)

```
1. User opens support chat (Zendesk/Intercom/Coinbase)
   │
2. Content script detects chat interface
   │
3. Content script observes new customer messages
   │
4. Extract conversation context (last N messages)
   │
5. Send context to background service worker
   │
6. Background worker calls Cloud Run API
   │
   POST /api/suggest-response
   {
     "platform": "zendesk",
     "conversation_context": [...],
     "user_preferences": {...},
     "mode": "suggestion"
   }
   │
7. FastAPI endpoint calls Vertex AI Gemini
   │
8. Gemini generates response suggestion
   │
9. Response returns through chain
   │
10. Content script injects suggestion panel
    │
11. Agent reviews and edits suggestion
    │
12. Agent clicks to copy/send response
    │
13. (Optional) Agent provides feedback on suggestion quality
```

### Mode 2: YOLO Flow (Autonomous Agent)

```
1. User enables YOLO mode in popup
   │
2. Configure goal (e.g., "Resolve customer's shipping issue")
   │
3. Content script activates autonomous mode
   │
4. Customer sends message
   │
5. Content script detects new message
   │
6. Extract conversation context + current goal state
   │
7. Send to background service worker
   │
   POST /api/autonomous-response
   {
     "platform": "zendesk",
     "conversation_context": [...],
     "goal": "resolve_shipping_issue",
     "goal_state": {
       "turns_taken": 2,
       "info_gathered": ["order_number", "tracking_id"],
       "current_step": "checking_status"
     },
     "safety_constraints": {
       "max_turns": 10,
       "escalation_keywords": ["angry", "manager", "complaint"],
       "stop_if_confused": true
     }
   }
   │
8. Backend analyzes goal progress
   │
9. Backend calls Vertex AI with goal-oriented prompt
   │
10. Gemini decides: Respond | Escalate | Need More Info | Goal Complete
    │
11. If Respond: Generate contextual response
    │
12. Backend returns action + response
    │
13. Content script injects AI response into chat input
    │
14. Auto-click send button (or wait for confirmation based on settings)
    │
15. Update goal tracker with new state
    │
16. Display status in popup (turns used, goal progress, etc.)
    │
17. Repeat steps 4-16 until:
    - Goal achieved
    - Escalation triggered
    - Max turns reached
    - Human intervention (emergency stop button clicked)
    - Safety condition violated
    │
18. When stopped: Notify agent, save conversation log, handoff to human
```

### Safety & Control Mechanisms

**Human Oversight:**
- Real-time monitoring dashboard in popup
- Conversation preview before sending (optional)
- Emergency stop button (instantly halts all auto-responses)
- Manual takeover at any time
- Conversation handoff notification

**Escalation Triggers:**
- Customer uses escalation keywords ("manager", "complaint", "angry")
- Sentiment becomes highly negative
- AI confidence below threshold (<0.7)
- Customer repeats same question 3+ times (confusion detected)
- Goal not progressing after N turns
- Explicit customer request ("I want to talk to a human")

**Safety Constraints:**
- Maximum conversation turns (default: 10)
- Require confirmation for sensitive actions (refunds, account changes)
- Never promise what can't be delivered
- Auto-escalate if uncertain
- Rate limiting (max 1 response per 10 seconds)

## Key Features

### Phase 1: Suggestion Mode (MVP)
- ✓ Detect and monitor support chat interfaces
- ✓ Extract conversation context
- ✓ Generate response suggestions via Gemini
- ✓ Display suggestions in overlay panel
- ✓ Copy suggestion to clipboard
- ✓ Basic settings (API key, enable/disable, tone)
- ✓ Mode selector (Suggestion vs YOLO)

### Phase 2: YOLO Mode Foundation
**Goal Configuration:**
- Pre-defined goal templates (Resolve issue, Gather info, Provide refund, etc.)
- Custom goal definition interface
- Goal progress tracking
- Multi-step goal decomposition

**Autonomous Response:**
- Auto-inject AI responses into chat
- Configurable send delay (preview before sending)
- Goal-oriented conversation management
- Response quality scoring

**Safety & Monitoring:**
- Real-time conversation monitoring dashboard
- Emergency stop button
- Escalation detection (keywords, sentiment)
- Max turn limits
- Conversation handoff to human

**Analytics & Logging:**
- YOLO mode conversation transcripts
- Goal completion rates
- Escalation frequency
- Time to resolution metrics
- AI confidence tracking

### Phase 3: Advanced Intelligence
**Multi-Goal Handling:**
- Parallel goal tracking
- Goal prioritization
- Dynamic goal switching
- Composite goals (gather info + resolve + upsell)

**Enhanced Safety:**
- Customer sentiment analysis
- Confusion detection (repeated questions)
- Frustration escalation
- Compliance checking (never promise what can't be delivered)
- Sensitive action confirmation (refunds, account changes)

**Adaptive Learning:**
- Learn from human interventions
- Improve goal completion strategies
- Personalize tone based on customer responses
- Context-aware template selection

### Phase 4: Enterprise Features
**Knowledge Base Integration:**
- Connect to company KB/documentation
- RAG (Retrieval Augmented Generation)
- Product-specific information retrieval
- Policy enforcement

**Multi-Agent Collaboration:**
- Handoff between AI agents
- Specialized agents (technical, billing, general)
- Agent routing based on query type

**Advanced Analytics:**
- Team performance dashboards
- AI vs human response comparison
- Customer satisfaction correlation
- Cost savings analysis
- A/B testing of strategies

**Compliance & Governance:**
- Conversation audit trails
- Regulatory compliance checking
- PII detection and redaction
- Approval workflows for sensitive actions

## Platform Support

### Initial Targets
1. **Coinbase** (crypto exchange platform)
2. **Zendesk** (common support platform)
3. **Intercom** (widely used)
3. **Custom chat widgets** (generic selectors)

### Future Support
- Salesforce Service Cloud
- Freshdesk
- Help Scout
- Custom internal tools

## Security Considerations

1. **API Key Management**
   - Store API keys in Chrome storage (encrypted)
   - Use service account with minimal permissions
   - Rotate keys regularly

2. **Data Privacy**
   - No customer data stored on servers (except YOLO mode logs with consent)
   - End-to-end encryption for API calls
   - Clear data retention policies
   - YOLO mode conversation logs encrypted at rest
   - Option to disable conversation logging

3. **Content Security Policy**
   - Strict CSP in manifest
   - No inline scripts
   - HTTPS-only API calls

4. **Permissions**
   - Minimal host permissions
   - activeTab permission (not all sites)
   - storage permission
   - Additional permission prompts for YOLO mode features

5. **YOLO Mode Specific Security**
   - **Action Approval:** Require explicit confirmation for sensitive actions
   - **Rate Limiting:** Prevent runaway automated responses
   - **Audit Logging:** Log all autonomous actions for review
   - **Human Override:** Emergency stop always available
   - **Escalation Safeguards:** Multiple redundant escalation triggers
   - **Compliance Checks:** Validate responses against policy rules
   - **No Sensitive Data in Prompts:** Never send PII to AI without masking
   - **Response Validation:** Check AI responses for prohibited content before sending

## Development Phases

### Phase 1: Foundation (Week 1-2)
- Set up Chrome extension structure
- Implement basic content script injection
- Create FastAPI backend with Docker
- Integrate Vertex AI Gemini API
- Deploy to Cloud Run
- Basic popup UI

### Phase 2: Core Features (Week 3-4)
- DOM detection for chat platforms
- Context extraction logic
- Suggestion display UI
- Settings management
- Error handling

### Phase 3: Polish (Week 5-6)
- UI/UX improvements
- Performance optimization
- Testing and bug fixes
- Documentation
- Deployment setup

## Performance Goals

- **Suggestion latency**: < 2 seconds
- **Extension overhead**: < 50MB memory
- **DOM observation**: Debounced (500ms)
- **Cache**: Recent 10 conversations
- **API rate limiting**: 60 requests/minute

## Cost Estimation (Monthly)

- **Cloud Run**: ~$5-15 (100K requests, includes CPU/memory)
- **Vertex AI Gemini**: ~$20-50 (depends on usage)
- **Firestore**: ~$1-5 (minimal storage)
- **Container Registry**: ~$1-2 (image storage)
- **Total**: ~$27-72/month (low usage)

## Success Metrics

### Suggestion Mode Metrics
1. **Adoption**: Active users, daily usage, suggestions requested
2. **Effectiveness**: Suggestion acceptance rate, edit rate before sending
3. **Performance**: Response time, error rate, uptime
4. **Quality**: Agent satisfaction scores, suggestion relevance rating
5. **Efficiency**: Time saved per interaction, messages handled per hour

### YOLO Mode Metrics
1. **Automation Rate**: % of conversations fully handled by AI
2. **Goal Completion**: Success rate for different goal types
3. **Escalation Rate**: % conversations requiring human intervention
4. **Safety Metrics**:
   - False escalations (stopped when shouldn't)
   - Missed escalations (continued when should've stopped)
   - Emergency stop frequency
5. **Quality Metrics**:
   - Customer satisfaction scores (CSAT) for AI-handled conversations
   - First Contact Resolution (FCR) rate
   - Average resolution time
   - Response accuracy (measured by human review)
6. **Efficiency Metrics**:
   - Agent time saved (hours per day)
   - Conversations per agent (with YOLO assistance)
   - Cost per conversation (AI vs human)
7. **Compliance Metrics**:
   - Policy violation rate
   - Audit findings
   - Human intervention reasons
8. **Learning Metrics**:
   - Goal completion improvement over time
   - Reduction in escalation rate
   - Improvement in confidence scores

### Combined Metrics
- **ROI**: Cost savings vs operational costs
- **User Satisfaction**: Agent NPS scores, customer feedback
- **Reliability**: System uptime, error recovery rate
