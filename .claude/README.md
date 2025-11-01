# Claude Code Configuration

This directory contains configuration files for Claude Code to help build the Support Chat AI Assistant.

## Project Overview

A Chrome extension that provides AI-powered response suggestions to support agents using:
- **Frontend**: Chrome Extension (TypeScript + React + Vite)
- **Backend**: GCP Cloud Run (Python 3.11 + FastAPI)
- **AI**: Google Vertex AI Gemini 1.5 Pro/Flash

## Quick Start

### For New Claude Code Sessions
1. Claude Code automatically loads `CLAUDE.md` from the root
2. Use slash commands: `/setup`, `/gcp-setup`, `/implement`
3. Use agents: "Review my code changes" (triggers code-reviewer agent)

### File Structure

```
.claude/
├── README.md                # This file
│
├── agents/                  # Autonomous agents (invoked on-demand)
│   ├── code-review.md       # Agent: Automated code reviews
│   └── debugger.md          # Agent: Error & debugging specialist
│
└── commands/                # Slash commands (invoked with /)
    ├── explain.md           # /explain - Explain code
    ├── gcp-setup.md         # /gcp-setup - Setup GCP infrastructure
    ├── implement.md         # /implement - Implement features
    ├── review.md            # /review - Manual code review command
    ├── setup.md             # /setup - Initialize project
    └── test.md              # /test - Generate tests

docs/
├── architecture-diagrams.md   # Visual architecture
├── dockerfile-example.md      # Docker configuration
├── project-context.md         # Development patterns
├── project-design.md          # Full architecture
├── sub-agents-guide.md        # How to create agents
└── tech-stack.md              # Technology details
```

## What Gets Loaded Automatically?

| File | Auto-Loaded? | When? |
|------|-------------|-------|
| `/CLAUDE.md` | ✅ Yes | On every Claude Code session start |
| `.claude/commands/*.md` | ⚡ On-demand | When you type `/command-name` |
| `.claude/agents/*.md` | 🤖 On-demand | When invoked or triggered |
| `docs/*.md` | ❌ No | When explicitly requested |

## How to Use

### Slash Commands
Type the command in chat:
```
/setup              → Initialize project structure
/gcp-setup          → Configure Google Cloud Platform
/implement          → Implement a feature
/review             → Manual code review
/test               → Generate tests
/explain            → Explain code architecture
```

### Agents (Claude-specific feature)
Invoke by name or trigger automatically:
```
"Use code-reviewer agent"
"Review my code changes"
"Check this for security issues"
"Use debugger agent"
"Debug this error"
```

**Available Agents:**
- **code-reviewer** (`.claude/agents/code-review.md`) - Automated code review for Chrome extension + FastAPI backend
- **debugger** (`.claude/agents/debugger.md`) - Root cause analysis and error fixing specialist

### Documentation
Reference when needed:
```
"Read docs/tech-stack.md"
"Show me the architecture diagrams"
"What's in project-design.md?"
```

## Development Workflow

### 1. Initial Setup
```
/setup              # Creates extension/ and backend/ directories
/gcp-setup          # Configures GCP infrastructure
```

### 2. Implementing Features
```
/implement
[Describe the feature you want to add]

# Or directly:
"Implement the DOM observer for Zendesk chat detection"
```

### 3. Code Review & Debugging
```
# Automatic review after changes:
"Review my code changes"

# Or explicit:
"Use code-reviewer to check the api-client.ts"

# Debug errors:
"Use debugger agent"
"Debug this test failure"
```

### 4. Testing
```
/test
[Describe what needs tests]

# Or:
"Generate tests for the gemini.py service"
```

### 5. Deployment
```bash
# Backend
cd backend
docker build -t gcr.io/PROJECT_ID/support-chat-ai .
gcloud run deploy support-chat-ai --image gcr.io/PROJECT_ID/support-chat-ai

# Extension
cd extension
npm run build
# Upload to Chrome Web Store
```

## Key Architecture Points

### Chrome Extension (3 Contexts)
1. **Content Scripts** - Injected into chat pages, observe DOM
2. **Service Worker** - Routes messages, calls Cloud Run API
3. **Popup/Options** - React UI for settings

**Critical Constraint:** Content scripts CANNOT make external API calls (CORS). Must route through service worker.

### Python Backend (FastAPI)
1. **API Routes** - `/api/suggest-response`, `/api/auth`, `/api/feedback`
2. **Services** - Vertex AI integration, context processing
3. **Models** - Pydantic validation for all requests/responses

**Critical Pattern:** Use async/await for all I/O operations (Vertex AI, Firestore)

### Data Flow
```
Customer Message → Content Script (DOM) → Service Worker →
Cloud Run API → Vertex AI Gemini → Response →
Service Worker → Content Script → Suggestion Panel
```

## Common Tasks

### Start Development
```bash
# Extension
cd extension && npm install && npm run dev

# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Run Tests
```bash
# Extension
cd extension && npm test

# Backend
cd backend && pytest
pytest tests/test_suggest.py  # Single file
pytest -k "test_name"          # Single test
```

### Build for Production
```bash
# Extension
cd extension && npm run build

# Backend (Docker)
cd backend && docker build -t support-chat-ai-backend .
```

## Documentation Quick Reference

| Need | Read |
|------|------|
| Overall architecture | `/CLAUDE.md` or `docs/project-design.md` |
| Technology stack | `docs/tech-stack.md` |
| Development patterns | `docs/project-context.md` |
| Visual diagrams | `docs/architecture-diagrams.md` |
| Docker setup | `docs/dockerfile-example.md` |
| Creating agents | `docs/sub-agents-guide.md` |

## Security & Privacy

**Critical Requirements:**
- ❌ No customer conversation data stored permanently
- ❌ No API keys or secrets in code
- ✅ All inputs validated with Pydantic
- ✅ API keys encrypted in chrome.storage
- ✅ Service account with minimum permissions
- ✅ HTTPS-only communication

## Performance Targets

- **Latency**: < 2 seconds (customer message → suggestion)
- **Memory**: < 50MB (extension footprint)
- **Debouncing**: 500ms minimum (DOM observation)
- **Rate Limiting**: 60 requests/minute per user

## Cost Estimates (Monthly)

- Cloud Run: ~$5-15 (100K requests)
- Vertex AI Gemini: ~$20-50 (usage-based)
- Firestore: ~$1-5 (analytics)
- **Total**: ~$27-72/month (low usage)

## Getting Help

- **Claude Code help**: Type `/help`
- **Project documentation**: Files in `docs/`
- **Agents guide**: `docs/sub-agents-guide.md`
- **Architecture details**: `/CLAUDE.md` in project root