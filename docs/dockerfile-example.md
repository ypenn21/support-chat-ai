# Dockerfile Example for Cloud Run

## Backend Dockerfile

Create this file at `backend/Dockerfile`:

```dockerfile
# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Run the application with uvicorn
# Cloud Run provides PORT environment variable
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

## requirements.txt

Create this file at `backend/requirements.txt`:

```txt
# FastAPI and ASGI server
fastapi==0.109.0
uvicorn[standard]==0.27.0
gunicorn==21.2.0

# Pydantic for data validation
pydantic==2.5.0
pydantic-settings==2.1.0

# Google Cloud SDKs
google-cloud-aiplatform==1.40.0
google-cloud-secret-manager==2.18.0
google-cloud-firestore==2.14.0
google-cloud-logging==3.9.0
vertexai==1.40.0

# Utilities
python-dotenv==1.0.0
httpx==0.26.0
python-multipart==0.0.6

# CORS middleware
python-jose[cryptography]==3.3.0
```

## requirements-dev.txt

For development dependencies:

```txt
# Include production requirements
-r requirements.txt

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.26.0

# Code quality
black==23.12.1
ruff==0.1.9
mypy==1.7.1

# Development tools
ipython==8.19.0
```

## .dockerignore

Create this file at `backend/.dockerignore`:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
*.egg-info/
.pytest_cache/
.mypy_cache/
.ruff_cache/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Tests
tests/
*.coverage
htmlcov/

# Documentation
*.md
docs/

# Git
.git/
.gitignore

# Other
Dockerfile
.dockerignore
```

## Local Development with Docker

Build and run locally:

```bash
# Build the image
docker build -t support-chat-ai-backend .

# Run locally
docker run -p 8080:8080 \
  -e GCP_PROJECT_ID=your-project-id \
  -e VERTEX_AI_LOCATION=us-central1 \
  -e GEMINI_MODEL=gemini-1.5-pro \
  support-chat-ai-backend

# Test
curl http://localhost:8080/health
```

## Multi-stage Build (Optimized)

For a smaller production image:

```dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY ./app ./app

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Expose port
EXPOSE 8080

# Run the application
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

## Cloud Build Configuration

Create `cloudbuild.yaml` for automated builds:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:$COMMIT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:latest'
      - './backend'

  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'support-chat-ai'
      - '--image=us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--service-account=support-chat-ai-sa@$PROJECT_ID.iam.gserviceaccount.com'
      - '--set-env-vars=GCP_PROJECT_ID=$PROJECT_ID,VERTEX_AI_LOCATION=us-central1,GEMINI_MODEL=gemini-1.5-pro'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:$COMMIT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/support-chat-ai/backend:latest'

options:
  machineType: 'N1_HIGHCPU_8'
```

## Health Check Endpoint

Add this to your FastAPI app for Cloud Run health checks:

```python
@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }
```
