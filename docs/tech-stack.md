# Technology Stack Details

## Chrome Extension Stack

### Core Technologies
```json
{
  "manifest_version": 3,
  "typescript": "^5.3.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

### Build & Development
- **Vite**: Fast dev server and optimized builds
- **@crxjs/vite-plugin**: Chrome extension support for Vite
- **TypeScript**: Type safety across the extension
- **ESLint + Prettier**: Code quality and formatting

### UI Framework
```json
{
  "tailwindcss": "^3.4.0",
  "shadcn/ui": "Latest",
  "lucide-react": "^0.300.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0"
}
```

### State & Data Management
- **Zustand**: Lightweight state management (~1KB)
- **Chrome Storage API**: Persistent storage
- **React Query (TanStack Query)**: API state management

### Content Script Libraries
- **mutation-observer**: DOM monitoring
- **tippy.js**: Tooltips and popovers (optional)

## Backend Stack (GCP Cloud Run - Python + FastAPI)

### Runtime & Framework
```txt
python==3.11
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
pydantic-settings==2.1.0
```

### Google Cloud SDK
```txt
google-cloud-aiplatform==1.40.0
google-cloud-secret-manager==2.18.0
google-cloud-firestore==2.14.0
google-cloud-logging==3.9.0
vertexai==1.40.0
```

### Utilities & Middleware
```txt
python-dotenv==1.0.0
httpx==0.26.0
python-multipart==0.0.6
gunicorn==21.2.0
```

## Project Structure

```
support-chat-ai/
├── extension/                    # Chrome extension source
│   ├── src/
│   │   ├── background/          # Service worker
│   │   │   ├── index.ts
│   │   │   ├── api-client.ts
│   │   │   ├── auth-manager.ts
│   │   │   └── message-router.ts
│   │   │
│   │   ├── content/             # Content scripts
│   │   │   ├── index.ts
│   │   │   ├── dom-observer.ts
│   │   │   ├── context-extractor.ts
│   │   │   ├── ui-injector.tsx
│   │   │   └── platforms/       # Platform-specific selectors
│   │   │       ├── zendesk.ts
│   │   │       ├── intercom.ts
│   │   │       └── generic.ts
│   │   │
│   │   ├── popup/               # Popup UI
│   │   │   ├── App.tsx
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   │       ├── Settings.tsx
│   │   │       ├── History.tsx
│   │   │       └── Status.tsx
│   │   │
│   │   ├── options/             # Options page
│   │   │   ├── App.tsx
│   │   │   └── index.tsx
│   │   │
│   │   ├── components/          # Shared components
│   │   │   └── ui/              # shadcn components
│   │   │
│   │   ├── lib/                 # Shared utilities
│   │   │   ├── storage.ts
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   │
│   │   └── styles/              # Global styles
│   │       └── globals.css
│   │
│   ├── public/                  # Static assets
│   │   ├── icons/
│   │   └── manifest.json
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                      # Cloud Run (Python + FastAPI)
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── __init__.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── suggest.py
│   │   │   │   ├── auth.py
│   │   │   │   └── feedback.py
│   │   │   └── deps.py          # Dependencies
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py        # Settings
│   │   │   └── security.py      # Auth logic
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── gemini.py        # Vertex AI integration
│   │   │   ├── context_processor.py
│   │   │   └── prompt_builder.py
│   │   │
│   │   ├── models/              # Pydantic models
│   │   │   ├── __init__.py
│   │   │   ├── request.py
│   │   │   └── response.py
│   │   │
│   │   └── middleware/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── cors.py
│   │       └── error_handler.py
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_suggest.py
│   │   └── test_gemini.py
│   │
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── pyproject.toml           # Optional: for Poetry
│
├── infrastructure/               # GCP infrastructure
│   ├── terraform/               # Terraform configs
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── scripts/
│       ├── deploy.sh
│       └── setup-gcp.sh
│
├── .claude/                      # Claude Code config
│   ├── commands/
│   └── docs/
│
├── .github/
│   └── workflows/
│       ├── build-extension.yml
│       └── deploy-backend.yml
│
└── README.md
```

## Development Environment Setup

### Prerequisites
```bash
# Required
- Python 3.11+
- Node.js 20+ (for extension only)
- npm or pnpm
- Google Cloud SDK
- Chrome browser

# Optional
- Docker (for local backend testing)
- Terraform (for infrastructure)
- Poetry (alternative to pip)
```

### Environment Variables

#### Extension (.env)
```bash
VITE_API_URL=https://your-cloud-function-url
VITE_ENV=development
```

#### Backend (.env)
```bash
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-1.5-pro
API_KEY_SECRET_NAME=support-chat-ai-api-key
FIRESTORE_COLLECTION=suggestions
```

## Chrome Extension Manifest V3

```json
{
  "manifest_version": 3,
  "name": "Support Chat AI Assistant",
  "version": "0.1.0",
  "description": "AI-powered response suggestions for support agents",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://*.zendesk.com/*",
    "https://*.intercom.io/*"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://*.zendesk.com/*", "https://*.intercom.io/*"],
      "js": ["src/content/index.ts"],
      "css": ["src/content/styles.css"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "options_page": "src/options/index.html",
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

## API Endpoints

### POST /api/suggest-response
```python
# Request (Pydantic model)
class Message(BaseModel):
    role: Literal["agent", "customer"]
    content: str
    timestamp: int

class UserPreferences(BaseModel):
    tone: Optional[Literal["professional", "friendly", "empathetic"]] = None
    length: Optional[Literal["short", "medium", "long"]] = None
    include_greeting: Optional[bool] = None

class SuggestRequest(BaseModel):
    platform: Literal["zendesk", "intercom", "generic"]
    conversation_context: list[Message]
    user_preferences: Optional[UserPreferences] = None

# Response (Pydantic model)
class Suggestion(BaseModel):
    id: str
    content: str
    confidence: float
    reasoning: Optional[str] = None

class Metadata(BaseModel):
    model_used: str
    latency: float
    token_count: int

class SuggestResponse(BaseModel):
    suggestions: list[Suggestion]
    metadata: Metadata
```

## Testing Strategy

### Extension Testing
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright (test on actual chat platforms)

### Backend Testing
- Unit tests: pytest
- Integration tests: pytest with fixtures for Vertex AI
- API tests: pytest + httpx (FastAPI TestClient)
- Load tests: locust or Artillery

## Deployment

### Extension
1. Build: `npm run build`
2. Package: Chrome Web Store Developer Dashboard
3. Submit for review

### Backend (Cloud Run)
1. Build Docker image: `docker build -t gcr.io/PROJECT_ID/support-chat-ai .`
2. Push to Container Registry: `docker push gcr.io/PROJECT_ID/support-chat-ai`
3. Deploy to Cloud Run: `gcloud run deploy support-chat-ai --image gcr.io/PROJECT_ID/support-chat-ai`
4. Configure environment variables and secrets
5. Set up monitoring and alerts

## Cost Optimization

1. **Caching**: Cache recent suggestions (reduce API calls)
2. **Batching**: Batch multiple requests if possible
3. **Model selection**: Use Gemini Flash for faster/cheaper responses
4. **Rate limiting**: Prevent abuse
5. **Monitoring**: Track usage and optimize
