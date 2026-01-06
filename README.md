# Support Chat AI Assistant

AI-powered response automation for customers interacting with support agents. Monitors support chat interfaces (such as Coinbase and Robinhood) and uses Google Vertex AI Gemini to automatically generate and send responses on behalf of customers.

## Architecture

**Tech Stack:**
- **Frontend**: Chrome Extension (Manifest V3) with TypeScript, React, Vite
- **Backend**: Python 3.11 + FastAPI on GCP Cloud Run
- **AI**: Google Vertex AI Gemini 2.5 Pro/Flash
- **Infrastructure**: GCP (Cloud Run, Firestore, Secret Manager, Artifact Registry)

**Three-Tier System:**
```
Chrome Extension FE → Cloud Run FastAPI BE → Vertex AI Gemini
```

## Quick Start

### Prerequisites

- **Node.js** 20+ and npm/pnpm
- **Python** 3.11+
- **Google Cloud SDK** ([Install](https://cloud.google.com/sdk/docs/install))
- **Chrome browser**
- **Docker** (optional, for local backend testing)

### Extension Setup

```bash
cd extension

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and set VITE_API_URL to your Cloud Run URL

# Start development server
npm run dev

# Build for production
npm run build
```

**Load Extension in Chrome:**
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension/dist` directory

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and configure GCP settings

# Start development server
uvicorn app.main:app --reload --port 8080
```

The API will be available at `http://localhost:8080`. Visit `http://localhost:8080/docs` for interactive API documentation.

## Project Structure

```
support-chat-ai/
├── extension/                    # Chrome extension
│   ├── src/
│   │   ├── background/          # Service worker (API calls)
│   │   ├── content/             # Injected scripts (DOM observation)
│   │   ├── popup/               # Extension popup UI
│   │   ├── options/             # Options page
│   │   ├── components/          # Shared React components
│   │   ├── lib/                 # Utilities
│   │   └── types/               # TypeScript types
│   ├── public/
│   │   └── manifest.json        # Extension manifest
│   └── package.json
│
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py              # App entry point
│   │   ├── api/routes/          # API endpoints
│   │   ├── core/                # Config & security
│   │   ├── services/            # Business logic
│   │   ├── models/              # Pydantic models
│   │   └── middleware/          # Custom middleware
│   ├── tests/                   # Test suite
│   ├── requirements.txt
│   └── Dockerfile
│
└── .claude/                      # Claude Code configuration
    ├── agents/                  # Specialized agents
    ├── commands/                # Slash commands
    └── docs/                    # Documentation
```

## Development

### Extension Development

```bash
cd extension

# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Testing
npm test
npm run test:ui
npm run test:coverage

# Build for production
npm run build
```

### Backend Development

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Run development server
uvicorn app.main:app --reload --port 8080

# Type checking
mypy app/

# Linting
black app/
flake8 app/
isort app/

# Testing
pytest
pytest --cov=app
pytest tests/test_suggest.py
```

### Docker Development (Backend)

```bash
cd backend

# Build image
docker build -t support-chat-ai-backend .

# Run container
docker run -p 8080:8080 \
  -e GCP_PROJECT_ID=your-project \
  -e VERTEX_AI_LOCATION=us-central1 \
  support-chat-ai-backend

# Test
curl http://localhost:8080/health
```

## Configuration

### Extension Environment Variables

Create `extension/.env`:

```bash
# Cloud Run API URL
VITE_API_URL=https://your-cloud-run-url.run.app

# Environment
VITE_ENV=development

# Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_LOGGING=true
```

### Backend Environment Variables

Create `backend/.env`:

```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
VERTEX_AI_LOCATION=us-central1

# Gemini Model
GEMINI_MODEL=gemini-1.5-pro

# Secret Manager
API_KEY_SECRET_NAME=support-chat-ai-api-key

# Server
PORT=8080
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=chrome-extension://your-extension-id,http://localhost:5173

# Environment
ENVIRONMENT=development
DEBUG=true
```

## Deployment

### Deploy Backend to Cloud Run

```bash
cd backend

# Set GCP project
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Build and push Docker image
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:latest .
docker push us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:latest

# Deploy to Cloud Run
gcloud run deploy support-chat-ai \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated

# Get service URL
gcloud run services describe support-chat-ai --region=us-central1 --format='value(status.url)'
```

### Build Extension for Chrome Web Store

```bash
cd extension

# Build production version
npm run build

# The dist/ folder contains the extension
# Zip it and upload to Chrome Web Store Developer Dashboard
```

## Key Features

### Chrome Extension
- ✅ Manifest V3 compliant
- ✅ Monitors chat interfaces on platforms like Coinbase and Robinhood
- ✅ Real-time DOM observation with MutationObserver
- ✅ React-based popup and options UI with Tailwind CSS
- ✅ Zustand for state management
- ✅ Chrome Storage API for persistence

### Backend API
- ✅ FastAPI with async/await patterns
- ✅ Pydantic validation for all requests/responses
- ✅ Vertex AI Gemini integration
- ✅ CORS support for Chrome extension
- ✅ Health check endpoint
- ✅ Structured logging

## API Endpoints

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "production"
}
```

### `POST /api/suggest-response` (Coming Soon)
Generate response suggestions

**Request:**
```json
{
  "platform": "coinbase",
  "conversation_context": [
    {
      "role": "agent",
      "content": "I see your order is still processing. Can you provide your order number?",
      "timestamp": 1704067200
    }
  ],
  "user_preferences": {
    "tone": "polite",
    "length": "medium"
  }
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "sugg_123",
      "content": "Sure! My order number is #12345. I placed it on December 20th...",
      "confidence": 0.92
    }
  ],
  "metadata": {
    "model_used": "gemini-1.5-pro",
    "latency": 1.23,
    "token_count": 156
  }
}
```

## Testing

### Extension Tests
```bash
cd extension
npm test                  # Run all tests
npm run test:ui          # Visual test runner
npm run test:coverage    # Coverage report
```

### Backend Tests
```bash
cd backend
pytest                              # All tests
pytest tests/test_suggest.py      # Single file
pytest -k "test_name"              # Specific test
pytest --cov=app                   # With coverage
```

## Security & Privacy

**Critical Requirements:**
- ❌ No conversation data stored permanently
- ❌ No API keys or secrets in code
- ✅ All inputs validated with Pydantic
- ✅ API keys encrypted in chrome.storage
- ✅ Service account with minimum permissions
- ✅ HTTPS-only communication

## Performance Targets

- **Latency**: < 2 seconds (support agent message → customer response)
- **Extension Memory**: < 50MB
- **DOM Observation**: Debounced to 500ms
- **Rate Limiting**: 60 requests/minute per user

## Cost Estimates (Monthly)

- Cloud Run: ~$5-15 (100K requests)
- Vertex AI Gemini: ~$20-50 (usage-based)
- Firestore: ~$1-5 (analytics)
- **Total**: ~$27-72/month (low usage)

## Troubleshooting

### Extension Issues

**Extension not loading:**
- Check manifest.json syntax
- Ensure all file paths are correct
- Check Chrome console for errors (`chrome://extensions` → Details → Errors)

**API calls failing:**
- Verify VITE_API_URL in .env
- Check CORS settings in backend
- Ensure service worker has correct permissions

### Backend Issues

**Import errors:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

**Vertex AI errors:**
- Check GCP credentials: `gcloud auth application-default login`
- Verify project ID and location in .env
- Ensure Vertex AI API is enabled

## Claude Code Integration

This project includes Claude Code configuration in `.claude/`:

**Available Commands:**
- `/setup` - Initialize project structure
- `/gcp-setup` - Configure GCP infrastructure
- `/implement` - Implement features
- `/review` - Code review
- `/test` - Generate tests

**Agents:**
- **code-reviewer** - Automated code review
- **debugger** - Error debugging and fixes

See [.claude/README.md](./.claude/README.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Check [.claude/docs/](./.claude/docs/) for detailed documentation
- Open an issue on GitHub
- Review the [project design](./.claude/docs/project-design.md)

---

Built with ❤️ using Claude Code
