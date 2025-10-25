# Backend API - Support Chat AI Assistant

FastAPI backend that provides AI-powered response suggestions using Google Vertex AI Gemini.

## Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set GCP_PROJECT_ID and other variables

# Run development server
uvicorn app.main:app --reload --port 8080
```

## Development

### Setup

1. **Python 3.11+**
   ```bash
   python --version  # Should be 3.11 or higher
   ```

2. **Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Dependencies**
   ```bash
   pip install -r requirements.txt
   # For development tools:
   pip install -r requirements-dev.txt
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env and configure:
   # - GCP_PROJECT_ID (required)
   # - VERTEX_AI_LOCATION (default: us-central1)
   # - GEMINI_MODEL (default: gemini-1.5-pro)
   # - Other settings
   ```

5. **GCP Authentication**
   ```bash
   # Install Google Cloud SDK
   # https://cloud.google.com/sdk/docs/install

   # Authenticate
   gcloud auth application-default login

   # Set project
   gcloud config set project YOUR_PROJECT_ID
   ```

### Run Development Server

```bash
uvicorn app.main:app --reload --port 8080
```

The server will be available at:
- **API**: http://localhost:8080
- **Docs**: http://localhost:8080/docs (Swagger UI)
- **ReDoc**: http://localhost:8080/redoc
- **Health**: http://localhost:8080/health

### Available Scripts

```bash
# Development server
uvicorn app.main:app --reload --port 8080

# Production server (Gunicorn)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8080

# Testing
pytest                      # Run all tests
pytest tests/test_suggest.py # Run specific test file
pytest -k "test_name"       # Run specific test
pytest --cov=app            # With coverage
pytest --cov=app --cov-report=html # HTML coverage report

# Code quality
black app/                  # Format code
flake8 app/                 # Lint
mypy app/                   # Type checking
isort app/                  # Sort imports

# All quality checks at once
black app/ && isort app/ && flake8 app/ && mypy app/
```

## Project Structure

```
app/
├── main.py                  # FastAPI app entry point
├── __init__.py
│
├── api/                     # API layer
│   ├── __init__.py
│   ├── routes/              # Route handlers
│   │   ├── __init__.py
│   │   ├── suggest.py       # POST /api/suggest-response
│   │   ├── auth.py          # Authentication endpoints
│   │   └── feedback.py      # POST /api/feedback
│   └── deps.py              # Dependencies (e.g., get_current_user)
│
├── core/                    # Core application
│   ├── __init__.py
│   ├── config.py            # Settings (Pydantic Settings)
│   └── security.py          # Authentication & authorization
│
├── services/                # Business logic
│   ├── __init__.py
│   ├── gemini.py            # Vertex AI Gemini integration
│   ├── context_processor.py # Process conversation context
│   └── prompt_builder.py    # Build prompts for Gemini
│
├── models/                  # Pydantic models
│   ├── __init__.py
│   ├── request.py           # Request models
│   └── response.py          # Response models
│
└── middleware/              # Custom middleware
    ├── __init__.py
    ├── auth.py              # Auth middleware
    ├── cors.py              # CORS config
    └── error_handler.py     # Global error handling
```

## API Endpoints

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development"
}
```

### Suggest Response (Coming Soon)

```bash
POST /api/suggest-response
Content-Type: application/json
```

**Request:**
```json
{
  "platform": "zendesk",
  "conversation_context": [
    {
      "role": "customer",
      "content": "My order hasn't arrived yet",
      "timestamp": 1704067200
    },
    {
      "role": "agent",
      "content": "I'd be happy to help. Could you provide your order number?",
      "timestamp": 1704067260
    },
    {
      "role": "customer",
      "content": "It's #12345",
      "timestamp": 1704067320
    }
  ],
  "user_preferences": {
    "tone": "empathetic",
    "length": "medium",
    "include_greeting": false
  }
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "sugg_abc123",
      "content": "Thank you for providing your order number. I've checked on order #12345...",
      "confidence": 0.92,
      "reasoning": "Acknowledges the order number, provides status..."
    }
  ],
  "metadata": {
    "model_used": "gemini-1.5-pro",
    "latency": 1.23,
    "token_count": 156
  }
}
```

## Configuration

### Environment Variables

Create `.env` file:

```bash
# GCP Configuration (Required)
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
VERTEX_AI_LOCATION=us-central1

# Gemini Model
GEMINI_MODEL=gemini-1.5-pro
# Or use gemini-1.5-flash for faster/cheaper responses

# Secret Manager
API_KEY_SECRET_NAME=support-chat-ai-api-key

# Firestore (Optional)
FIRESTORE_COLLECTION=suggestions

# Server
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=info

# CORS (comma-separated)
ALLOWED_ORIGINS=chrome-extension://your-extension-id,http://localhost:5173

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Environment
ENVIRONMENT=development
DEBUG=true
```

### Pydantic Settings

Configuration is managed by `app/core/config.py` using Pydantic Settings:

```python
from app.core.config import settings

# Access configuration
print(settings.GCP_PROJECT_ID)
print(settings.GEMINI_MODEL)
```

## Key Patterns

### Async/Await

All I/O operations should use async/await:

```python
from fastapi import APIRouter
from app.models.request import SuggestRequest
from app.models.response import SuggestResponse

router = APIRouter()

@router.post("/api/suggest-response", response_model=SuggestResponse)
async def suggest_response(request: SuggestRequest):
    # Async Vertex AI call
    suggestion = await generate_suggestion(request)
    return SuggestResponse(suggestions=[suggestion], metadata={...})
```

### Pydantic Validation

All requests and responses use Pydantic models:

```python
from pydantic import BaseModel, Field
from typing import Literal

class Message(BaseModel):
    role: Literal["agent", "customer"]
    content: str = Field(..., min_length=1, max_length=10000)
    timestamp: int = Field(..., gt=0)
```

### Error Handling

Use FastAPI's HTTPException:

```python
from fastapi import HTTPException

if not conversation_context:
    raise HTTPException(
        status_code=400,
        detail="Conversation context is required"
    )
```

### Dependency Injection

Use FastAPI dependencies:

```python
from fastapi import Depends
from app.api.deps import get_current_user

@router.post("/api/suggest-response")
async def suggest_response(
    request: SuggestRequest,
    user: User = Depends(get_current_user)
):
    # user is automatically injected
    ...
```

## Testing

### Run Tests

```bash
# All tests
pytest

# Specific file
pytest tests/test_suggest.py

# Specific test
pytest tests/test_suggest.py::test_suggest_response

# With coverage
pytest --cov=app

# With HTML coverage report
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

### Writing Tests

**Example test:**

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_suggest_response():
    request_data = {
        "platform": "zendesk",
        "conversation_context": [
            {
                "role": "customer",
                "content": "Test message",
                "timestamp": 1704067200
            }
        ]
    }
    response = client.post("/api/suggest-response", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0
```

### Mocking Vertex AI

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
@patch('app.services.gemini.GenerativeModel')
async def test_gemini_integration(mock_model):
    # Mock Vertex AI response
    mock_model.return_value.generate_content_async = AsyncMock(
        return_value=MockResponse(text="Suggested response")
    )

    result = await generate_suggestion(request)
    assert result.content == "Suggested response"
```

## Docker

### Build Image

```bash
docker build -t support-chat-ai-backend .
```

### Run Container

```bash
docker run -p 8080:8080 \
  -e GCP_PROJECT_ID=your-project \
  -e VERTEX_AI_LOCATION=us-central1 \
  support-chat-ai-backend
```

### Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - ./app:/app/app
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

Run: `docker-compose up`

## Deployment to Cloud Run

### Build & Push

```bash
# Set project
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Build
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:latest .

# Push
docker push us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:latest
```

### Deploy

```bash
gcloud run deploy support-chat-ai \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,ENVIRONMENT=production"
```

### Get URL

```bash
gcloud run services describe support-chat-ai \
  --region=us-central1 \
  --format='value(status.url)'
```

## Security Best Practices

1. **No Customer Data Storage**: Conversation context only in memory during request
2. **Environment Variables**: All secrets in env vars or Secret Manager
3. **Input Validation**: Pydantic validates all inputs
4. **Rate Limiting**: Implement per-user rate limits
5. **CORS**: Restrict origins to extension ID
6. **Logging**: Never log customer data or API keys

## Performance

### Optimization Tips

1. **Use Gemini Flash**: Faster and cheaper than Pro
   ```bash
   GEMINI_MODEL=gemini-1.5-flash
   ```

2. **Cache Results**: Cache recent suggestions
3. **Connection Pooling**: httpx client with connection pooling
4. **Async All the Way**: Use async/await for all I/O
5. **Monitor Latency**: Track response times

### Benchmarking

```bash
# Install locust
pip install locust

# Create locustfile.py for load testing
# Run: locust -f locustfile.py
```

## Troubleshooting

**ModuleNotFoundError:**
- Ensure venv is activated
- Run `pip install -r requirements.txt`

**GCP Authentication Error:**
```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

**Vertex AI Permission Denied:**
- Enable Vertex AI API in GCP Console
- Ensure service account has `aiplatform.user` role

**Import Errors:**
- Check PYTHONPATH includes project root
- Use absolute imports: `from app.models import ...`

## Next Steps

1. Implement API routes in `app/api/routes/suggest.py`
2. Implement Vertex AI service in `app/services/gemini.py`
3. Create prompt builder in `app/services/prompt_builder.py`
4. Add authentication middleware
5. Write comprehensive tests
6. Deploy to Cloud Run

Use Claude Code's `/implement` command for guided implementation!
