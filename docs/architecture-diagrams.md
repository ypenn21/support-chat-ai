# Architecture Diagrams

## Dual Mode Operation Overview

The Support Chat AI Assistant operates in two distinct modes:

**Suggestion Mode (Human-in-the-Loop):** AI provides suggestions that agents review and send manually.

**YOLO Mode (Autonomous Agent):** AI automatically responds to customers based on configurable goals, with human oversight and emergency controls.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Support Agent's Browser                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Support Chat Website                          │   │
│  │              (Robinhood, Coinbase, Zendesk, etc.)               │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │   Customer   │  │   Agent      │  │   Chat       │          │   │
│  │  │   Messages   │  │   Input      │  │   History    │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │         ▲                                                        │   │
│  │         │                                                        │   │
│  │         │ DOM Monitoring                                        │   │
│  └─────────┼──────────────────────────────────────────────────────┘   │
│            │                                                            │
│  ┌─────────┼──────────────────────────────────────────────────────┐   │
│  │         │         Chrome Extension (Manifest V3)               │   │
│  │         │                                                        │   │
│  │  ┌──────▼────────────────────────────────────────────────┐     │   │
│  │  │           Content Script (Injected)                    │     │   │
│  │  │  ┌─────────────────────────────────────────────────┐  │     │   │
│  │  │  │  • DOM Observer (MutationObserver)              │  │     │   │
│  │  │  │  • Message Detector (Find new customer msgs)    │  │     │   │
│  │  │  │  • Context Extractor (Last N messages)          │  │     │   │
│  │  │  │  • UI Injector (Display suggestion panel)       │  │     │   │
│  │  │  └─────────────────────────────────────────────────┘  │     │   │
│  │  └────────────────┬──────────────▲─────────────────────┘  │     │   │
│  │                   │              │                         │     │   │
│  │                   │ Messages     │ Response                │     │   │
│  │                   │              │                         │     │   │
│  │  ┌────────────────▼──────────────┴─────────────────────┐  │     │   │
│  │  │        Background Service Worker                     │  │     │   │
│  │  │  ┌─────────────────────────────────────────────────┐ │  │     │   │
│  │  │  │  • Message Router (content ↔ popup)             │ │  │     │   │
│  │  │  │  • API Client (HTTP requests)                   │ │  │     │   │
│  │  │  │  • Auth Manager (API keys)                      │ │  │     │   │
│  │  │  │  • Cache Manager (Recent suggestions)           │ │  │     │   │
│  │  │  │  • Settings Manager (User preferences)          │ │  │     │   │
│  │  │  └─────────────────────────────────────────────────┘ │  │     │   │
│  │  └────────────────┬──────────────▲─────────────────────┘  │     │   │
│  │                   │              │                         │     │   │
│  │  ┌────────────────▼──────────────┴─────────────────────┐  │     │   │
│  │  │               Popup UI (React)                       │  │     │   │
│  │  │  • Settings Panel                                    │  │     │   │
│  │  │  • History Viewer                                    │  │     │   │
│  │  │  • Status Indicator                                  │  │     │   │
│  │  └──────────────────────────────────────────────────────┘  │     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────▲──────────────────────┘
                            │                 │
                            │ HTTPS           │ JSON Response
                            │ POST            │
                            │                 │
┌───────────────────────────▼─────────────────┴──────────────────────┐
│                  Google Cloud Platform                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           Cloud Function (Node.js 20)                        │ │
│  │                                                               │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  POST /api/suggest-response                            │  │ │
│  │  │                                                         │  │ │
│  │  │  1. Validate request & authenticate                    │  │ │
│  │  │  2. Extract conversation context                       │  │ │
│  │  │  3. Build prompt for Gemini                            │  │ │
│  │  │  4. Call Vertex AI                                     │  │ │
│  │  │  5. Process response                                   │  │ │
│  │  │  6. Return formatted suggestions                       │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────┬─────────────────▲──────────────────┘ │
│                           │                 │                     │
│                           │ API Call        │ Generated Text      │
│                           │                 │                     │
│  ┌────────────────────────▼─────────────────┴──────────────────┐ │
│  │              Vertex AI (Gemini 1.5 Pro/Flash)               │ │
│  │                                                              │ │
│  │  • Generative AI Model                                      │ │
│  │  • Context understanding                                    │ │
│  │  • Response generation                                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         Supporting Services                                  │ │
│  │                                                              │ │
│  │  • Secret Manager (API keys)                                │ │
│  │  • Firestore (Analytics/feedback)                           │ │
│  │  • Cloud Logging (Logs)                                     │ │
│  │  • Cloud Monitoring (Metrics)                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence Diagram: Suggestion Mode

```
Agent Opens Chat          Content Script         Service Worker         Cloud Run API         Vertex AI
      │                          │                       │                      │                    │
      │  1. Load chat page       │                       │                      │                    │
      ├─────────────────────────►│                       │                      │                    │
      │                          │                       │                      │                    │
      │                          │  2. Initialize        │                      │                    │
      │                          │  observers            │                      │                    │
      │                          │                       │                      │                    │
Customer sends message           │                       │                      │                    │
      │                          │                       │                      │                    │
      │                          │  3. Detect new        │                      │                    │
      │                          │  message (DOM)        │                      │                    │
      │                          │                       │                      │                    │
      │                          │  4. Extract context   │                      │                    │
      │                          │  (last N messages)    │                      │                    │
      │                          │                       │                      │                    │
      │                          │  5. Send context      │                      │                    │
      │                          ├──────────────────────►│                      │                    │
      │                          │   chrome.runtime      │                      │                    │
      │                          │   .sendMessage()      │                      │                    │
      │                          │                       │                      │                    │
      │                          │                       │  6. POST to API      │                    │
      │                          │                       ├─────────────────────►│                    │
      │                          │                       │  (HTTPS request)     │                    │
      │                          │                       │                      │                    │
      │                          │                       │                      │  7. Build prompt   │
      │                          │                       │                      │                    │
      │                          │                       │                      │  8. Call Gemini    │
      │                          │                       │                      ├───────────────────►│
      │                          │                       │                      │                    │
      │                          │                       │                      │  9. Generate text  │
      │                          │                       │                      │◄───────────────────┤
      │                          │                       │                      │                    │
      │                          │                       │  10. Format response │                    │
      │                          │                       │◄─────────────────────┤                    │
      │                          │                       │  (JSON)              │                    │
      │                          │                       │                      │                    │
      │                          │  11. Return suggestion│                      │                    │
      │                          │◄──────────────────────┤                      │                    │
      │                          │   sendResponse()      │                      │                    │
      │                          │                       │                      │                    │
      │                          │  12. Inject UI panel  │                      │                    │
      │                          │  with suggestion      │                      │                    │
      │                          │                       │                      │                    │
      │  13. Display suggestion  │                       │                      │                    │
      │◄─────────────────────────┤                       │                      │                    │
      │                          │                       │                      │                    │
Agent reviews/edits              │                       │                      │                    │
      │                          │                       │                      │                    │
      │  14. Copy to input       │                       │                      │                    │
      ├─────────────────────────►│                       │                      │                    │
      │                          │                       │                      │                    │
      │  15. Send to customer    │                       │                      │                    │
      ├──────────────────────────►                       │                      │                    │
```

## Data Flow Sequence Diagram: YOLO Mode

```
Agent Enables YOLO        Content Script         Service Worker         Cloud Run API         Vertex AI
      │                          │                       │                      │                    │
      │  1. Configure goal       │                       │                      │                    │
      │  "Resolve shipping"      │                       │                      │                    │
      ├─────────────────────────►│                       │                      │                    │
      │                          │                       │                      │                    │
      │                          │  2. Activate          │                      │                    │
      │                          │  autonomous mode      │                      │                    │
      │                          │                       │                      │                    │
Customer sends message           │                       │                      │                    │
      │                          │                       │                      │                    │
      │                          │  3. Detect message    │                      │                    │
      │                          │  + Extract context    │                      │                    │
      │                          │                       │                      │                    │
      │                          │  4. Send context      │                      │                    │
      │                          │  + goal state         │                      │                    │
      │                          ├──────────────────────►│                      │                    │
      │                          │                       │                      │                    │
      │                          │                       │  5. POST /autonomous │                    │
      │                          │                       ├─────────────────────►│                    │
      │                          │                       │  {goal, context,     │                    │
      │                          │                       │   safety_rules}      │                    │
      │                          │                       │                      │                    │
      │                          │                       │                      │  6. Goal analysis  │
      │                          │                       │                      │  Check safety      │
      │                          │                       │                      │                    │
      │                          │                       │                      │  7. Build goal-    │
      │                          │                       │                      │  oriented prompt   │
      │                          │                       │                      │                    │
      │                          │                       │                      │  8. Call Gemini    │
      │                          │                       │                      ├───────────────────►│
      │                          │                       │                      │                    │
      │                          │                       │                      │  9. Decide action: │
      │                          │                       │                      │  Respond/Escalate/ │
      │                          │                       │                      │  Need-info/Done    │
      │                          │                       │                      │◄───────────────────┤
      │                          │                       │                      │                    │
      │                          │                       │  10. Return action   │                    │
      │                          │                       │  + response + state  │                    │
      │                          │                       │◄─────────────────────┤                    │
      │                          │                       │                      │                    │
      │                          │  11. Receive response │                      │                    │
      │                          │  + new goal state     │                      │                    │
      │                          │◄──────────────────────┤                      │                    │
      │                          │                       │                      │                    │
      │                          │  12. Check safety     │                      │                    │
      │                          │  (escalation check)   │                      │                    │
      │                          │                       │                      │                    │
      │                          │  13. Inject response  │                      │                    │
      │                          │  into chat input      │                      │                    │
      │                          │                       │                      │                    │
      │  14. Preview (optional)  │                       │                      │                    │
      │◄─────────────────────────┤                       │                      │                    │
      │                          │                       │                      │                    │
      │  (3 second delay)        │                       │                      │                    │
      │                          │                       │                      │                    │
      │                          │  15. Click send       │                      │                    │
      │                          │  button (automated)   │                      │                    │
      │                          │                       │                      │                    │
Response sent to customer        │                       │                      │                    │
      │                          │                       │                      │                    │
      │                          │  16. Update popup     │                      │                    │
      │                          │  (turns: 3, goal:     │                      │                    │
      │                          │   "gathering info")   │                      │                    │
      │                          │                       │                      │                    │
      │  17. Monitor in popup    │                       │                      │                    │
      │◄─────────────────────────┤                       │                      │                    │
      │                          │                       │                      │                    │
[Repeat for each customer message until goal complete or escalation]
      │                          │                       │                      │                    │
      │  18. Goal achieved OR    │                       │                      │                    │
      │  Escalation triggered    │                       │                      │                    │
      │◄─────────────────────────┤                       │                      │                    │
      │                          │                       │                      │                    │
      │  19. Notification +      │                       │                      │                    │
      │  conversation log        │                       │                      │                    │
      │◄─────────────────────────┤                       │                      │                    │
```

## Component Interaction Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                      Chrome Extension Layers                      │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: DOM Integration (Content Script Context)             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ DOM Observer │  │   Context    │  │ UI Injector  │         │
│  │              │  │  Extractor   │  │              │         │
│  │ Monitors     │─►│ Parses chat  │  │ Creates      │         │
│  │ mutations    │  │ messages     │  │ suggestion   │         │
│  │              │  │              │  │ panel        │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  ▲                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────┼─────────────────┐
│  Layer 2: Extension Core (Service Worker Context)              │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Message    │  │  API Client  │  │    Cache     │         │
│  │   Router     │  │              │  │   Manager    │         │
│  │              │  │ HTTP fetch   │  │              │         │
│  │ Routes msgs  │─►│ to Cloud     │  │ Stores       │         │
│  │ between      │  │ Function     │  │ recent       │         │
│  │ components   │  │              │  │ suggestions  │         │
│  └──────────────┘  └──────┬───────┘  └──────────────┘         │
│         ▲                  │                                    │
└─────────┼──────────────────┼────────────────────────────────────┘
          │                  │
          │                  │
┌─────────┼──────────────────▼────────────────────────────────────┐
│  Layer 3: UI Components (Browser Action Context)               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Settings   │  │   History    │  │    Status    │         │
│  │     Panel    │  │    Viewer    │  │  Indicator   │         │
│  │              │  │              │  │              │         │
│  │ Configure    │  │ Show past    │  │ Connection   │         │
│  │ preferences  │  │ suggestions  │  │ health       │         │
│  │              │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Platform Detection Flow

```
Content Script Loads
        │
        ▼
    Check URL
        │
        ├──► zendesk.com ──► Load Zendesk Adapter
        │                          │
        │                          ├─► Chat container: .chat-wrapper
        │                          ├─► Messages: .chat-msg-text
        │                          └─► Input: .chat-input
        │
        ├──► intercom.io ──► Load Intercom Adapter
        │                          │
        │                          ├─► Chat container: .intercom-messenger
        │                          ├─► Messages: .intercom-message
        │                          └─► Input: .intercom-composer-input
        │
        └──► Other ─────────► Load Generic Adapter
                                   │
                                   ├─► Try common selectors
                                   ├─► Message detection heuristics
                                   └─► Fallback to user configuration
```

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application State                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Chrome Storage (Persistent)                        │   │
│  │  • API keys                                         │   │
│  │  • User preferences                                 │   │
│  │  • Platform configurations                          │   │
│  │  • Suggestion history                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ▲                                   │
│                         │ Sync                              │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Zustand Store (Runtime)                            │   │
│  │  • Current suggestion                               │   │
│  │  • Loading states                                   │   │
│  │  • Error messages                                   │   │
│  │  • UI state (panel visible, etc.)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ▲                                   │
│                         │ Subscribe                         │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Components                                   │   │
│  │  • Popup UI                                         │   │
│  │  • Options page                                     │   │
│  │  • Injected suggestion panel                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Error Occurs
    │
    ▼
Categorize Error
    │
    ├──► Network Error ────► Retry with exponential backoff
    │                               │
    │                               ├──► Success ──► Continue
    │                               │
    │                               └──► Max retries ──► Show error to user
    │
    ├──► API Error (4xx) ──► Log error
    │                               │
    │                               └──► Show user-friendly message
    │
    ├──► API Error (5xx) ──► Log error + Report to monitoring
    │                               │
    │                               └──► Retry once, then show error
    │
    ├──► DOM Error ────────► Try fallback selectors
    │                               │
    │                               ├──► Success ──► Continue
    │                               │
    │                               └──► Fail ──► Disable for this platform
    │
    └──► Unknown Error ────► Log stack trace
                                    │
                                    └──► Generic error message to user
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Development                              │
│                                                             │
│  Local Machine                                              │
│  ├── extension/ (Vite dev server)                           │
│  ├── backend/ (Functions Framework)                         │
│  └── Test with chrome://extensions                          │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ git push
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD (GitHub Actions)                   │
│                                                             │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │ Build Extension │          │ Deploy Backend  │          │
│  │ • npm run build │          │ • gcloud deploy │          │
│  │ • Run tests     │          │ • Run tests     │          │
│  │ • Create .zip   │          │                 │          │
│  └────────┬────────┘          └────────┬────────┘          │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            ▼                              ▼
┌──────────────────────┐      ┌──────────────────────────────┐
│ Chrome Web Store     │      │  Google Cloud Platform       │
│                      │      │                              │
│ • Automated upload   │      │  • Cloud Functions (Live)    │
│ • Review process     │      │  • Vertex AI                 │
│ • Public distribution│      │  • Firestore                 │
└──────────────────────┘      │  • Secret Manager            │
                              └──────────────────────────────┘
                                          │
                                          │ Used by
                                          ▼
                              ┌──────────────────────────────┐
                              │   End Users (Support Agents) │
                              └──────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: Extension Security
├── Content Security Policy (CSP)
│   └── No inline scripts, no eval()
├── Host Permissions
│   └── Only specific support platforms
└── Sandboxed contexts
    └── Service worker isolated from web pages

Layer 2: Data Protection
├── API Keys
│   ├── Encrypted in chrome.storage
│   └── Never logged or exposed
├── Conversation Data
│   ├── Never stored permanently
│   ├── Cleared after suggestion
│   └── Encrypted in transit (HTTPS)
└── User Privacy
    └── No tracking or analytics without consent

Layer 3: API Security
├── Authentication
│   ├── API key validation
│   └── Service account tokens
├── Rate Limiting
│   ├── Per-user limits
│   └── Global limits
└── Input Validation
    ├── Schema validation (Zod)
    └── Sanitize inputs

Layer 4: GCP Security
├── IAM Policies
│   └── Least privilege access
├── Secret Manager
│   └── Encrypted secrets
├── VPC (Optional)
│   └── Private API endpoints
└── Audit Logging
    └── Track all access
```

## YOLO Mode: Goal-Oriented Conversation Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    YOLO Mode State Machine                     │
└────────────────────────────────────────────────────────────────┘

                    [Agent Enables YOLO Mode]
                              │
                              ▼
                    ┌──────────────────┐
                    │   Configure Goal │
                    │  & Safety Rules  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   INITIALIZING   │
                    │  - Set max turns │
                    │  - Load rules    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   WAITING FOR    │
                    │  CUSTOMER MSG    │
                    └────────┬─────────┘
                             │
                  [Customer sends message]
                             │
                             ▼
                    ┌──────────────────┐
                    │   ANALYZING      │
                    │  - Extract context│
                    │  - Check safety   │
                    │  - Eval goal state│
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
        ┌───────────▼──────┐    ┌─────▼───────────┐
        │ ESCALATION CHECK │    │  GOAL PROGRESS  │
        │  Detected?       │    │  Assessment     │
        └────┬──────┬──────┘    └────┬────────────┘
             │      │                 │
           YES     NO                 ▼
             │      │        ┌─────────────────┐
             │      │        │ GENERATE        │
             │      └───────►│ RESPONSE        │
             │               │ (Call Gemini)   │
             │               └────┬────────────┘
             │                    │
             │                    ▼
             │               ┌─────────────────┐
             │               │ SAFETY CHECK    │
             │               │ - Validate resp │
             │               │ - Confidence OK?│
             │               └────┬──────┬─────┘
             │                    │      │
             │                   OK    FAIL
             │                    │      │
             │                    ▼      │
             │               ┌─────────────────┐
             │               │ INJECT & SEND   │
             │               │ - Add to input  │
             │               │ - Click send    │
             │               └────┬────────────┘
             │                    │
             │                    ▼
             │               ┌─────────────────┐
             │               │ UPDATE STATE    │
             │               │ - Increment turn│
             │               │ - Update goal   │
             │               └────┬────────────┘
             │                    │
             │          ┌─────────┴─────────┐
             │          │                   │
             │     [Max turns?]        [Goal Done?]
             │          │                   │
             │         YES                 YES
             │          │                   │
             ▼          ▼                   ▼
        ┌────────────────────────────────────┐
        │         ESCALATE TO HUMAN          │
        │  - Stop auto-responses             │
        │  - Notify agent                    │
        │  - Save conversation log           │
        │  - Display handoff message         │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │         CONVERSATION END           │
        │  - Save metrics                    │
        │  - Reset state                     │
        │  - Return to manual mode           │
        └────────────────────────────────────┘
```

## YOLO Mode: Safety & Control Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOLO Mode Control Panel                      │
│                    (Extension Popup)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  MODE: YOLO (Autonomous)                    [STOP] 🛑     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  CURRENT GOAL                                             │ │
│  │  Resolve customer's shipping delay issue                 │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━ 60% Complete                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  CONVERSATION STATUS                                      │ │
│  │                                                           │ │
│  │  Turns Used:      3 / 10                                 │ │
│  │  Confidence:      High (0.89)                            │ │
│  │  Info Gathered:   ✓ Order number                         │ │
│  │                   ✓ Tracking ID                          │ │
│  │                   ⏳ Expected delivery                    │ │
│  │  Next Step:       Check warehouse status                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  LIVE CONVERSATION                         [Take Over]    │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ 👤 Customer: My package hasn't arrived              │ │ │
│  │  │ 🤖 AI: I understand your concern. Could you provide │ │ │
│  │  │        your order number?                            │ │ │
│  │  │ 👤 Customer: #ORD-12345                              │ │ │
│  │  │ 🤖 AI: Thank you! Let me check on order #ORD-12345. │ │ │
│  │  │        I see it's currently in transit...            │ │ │
│  │  │ [Sending...]                                         │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  SAFETY MONITORS                                          │ │
│  │                                                           │ │
│  │  Escalation Keywords:   None detected                    │ │
│  │  Sentiment:             Neutral                          │ │
│  │  Confusion Detected:    No                               │ │
│  │  Policy Violations:     None                             │ │
│  │  Rate Limit:            OK (last msg 12s ago)            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ACTIONS                                                  │ │
│  │  [⏸ Pause YOLO]  [✋ Manual Takeover]  [📋 View Log]     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## YOLO Mode: Escalation Decision Tree

```
                      [New Customer Message]
                              │
                              ▼
                    ┌──────────────────┐
                    │ ESCALATION CHECK │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ SENTIMENT    │    │ KEYWORDS     │    │ GOAL STATE   │
│ ANALYSIS     │    │ DETECTION    │    │ ANALYSIS     │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
  Is sentiment         Contains:          Goal progress
  highly negative?     - "manager"        stalled?
       │               - "complaint"           │
       │               - "angry"               │
       │               - "supervisor"          │
       │                   │                   │
       └─────────┬─────────┴─────────┬─────────┘
                 │                   │
                YES                 NO
                 │                   │
                 ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │ CHECK        │    │ CONFIDENCE   │
        │ ADDITIONAL   │    │ CHECK        │
        │ FACTORS      │    └──────┬───────┘
        └──────┬───────┘           │
               │              Is AI conf.
          - Max turns         below 0.7?
          - Repeated Qs            │
          - Confusion         ┌────┴────┐
               │             YES       NO
               │              │         │
               ▼              ▼         ▼
        ┌──────────────┐  ┌──────────────┐
        │ ESCALATE!    │  │ CONTINUE     │
        │              │  │ AUTONOMOUS   │
        │ 1. Stop auto │  │ MODE         │
        │ 2. Notify    │  │              │
        │ 3. Handoff   │  │ Generate AI  │
        │ 4. Log       │  │ response     │
        └──────────────┘  └──────────────┘
```

## YOLO Mode: Multi-Goal Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                  Goal Templates Library                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ GOAL TYPE 1: Information Gathering                      │
│                                                          │
│ Objective: Collect specific information from customer   │
│ Required Info:                                           │
│   • Order number                                         │
│   • Email address                                        │
│   • Issue description                                    │
│ Max Turns: 5                                             │
│ Success Criteria: All required info collected            │
│ Escalation: If customer refuses to provide info          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ GOAL TYPE 2: Issue Resolution                           │
│                                                          │
│ Objective: Resolve customer's shipping delay            │
│ Steps:                                                   │
│   1. Gather order number ✓                               │
│   2. Check tracking status ⏳                             │
│   3. Provide estimated delivery ⬜                         │
│   4. Offer compensation (if delayed >3 days) ⬜            │
│ Max Turns: 10                                            │
│ Success Criteria: Customer satisfied with resolution     │
│ Escalation: If refund >$100 required                     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ GOAL TYPE 3: Escalation to Specialist                   │
│                                                          │
│ Objective: Gather info and route to right specialist    │
│ Information to Collect:                                  │
│   • Issue category (Technical/Billing/General)           │
│   • Urgency level                                        │
│   • Account details                                      │
│   • Previous contact history                             │
│ Max Turns: 3                                             │
│ Success Criteria: Handoff with complete context          │
│ Escalation: Immediate if critical issue                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ GOAL TYPE 4: Upsell / Cross-sell                        │
│                                                          │
│ Objective: Suggest relevant products/upgrades           │
│ Prerequisites:                                           │
│   • Customer satisfied with support                      │
│   • No active complaints                                 │
│   • Positive sentiment                                   │
│ Approach: Soft suggestion, no pressure                   │
│ Max Turns: 2                                             │
│ Success Criteria: Offer presented without pushback       │
│ Escalation: If customer shows annoyance                  │
└──────────────────────────────────────────────────────────┘
```

These comprehensive diagrams illustrate the dual-mode operation, goal-oriented autonomous behavior, safety mechanisms, and control interfaces for the Support Chat AI Assistant.
