# Support Chat AI Assistant - Project Context

## What You're Building

A Chrome extension that acts as an intelligent co-pilot for customer support agents. When a support agent is chatting with customers on platforms like Robinhood, Coinbase, or any support chat interface, this extension:

1. Monitors the conversation in real-time
2. Extracts the context and customer's issue
3. Sends the context to Google Cloud Vertex AI Gemini
4. Returns AI-generated response suggestions
5. Displays suggestions in an overlay panel
6. Allows the agent to copy, edit, or customize the response

## Core Technical Decisions

### Why Manifest V3?
- Required by Chrome (Manifest V2 is deprecated)
- Service workers instead of background pages
- Better security and performance

### Why Vertex AI Gemini?
- Latest Google AI model with strong reasoning
- Better at understanding context than older models
- Flexible pricing (Pro vs Flash)
- Native GCP integration

### Why Cloud Run?
- Containerized deployment (more flexible than Cloud Functions)
- Auto-scaling with better cold start control
- Pay only for what you use
- Supports any language/framework
- Better for Python FastAPI applications

### Why Python + FastAPI?
- FastAPI: Modern, fast Python framework
- Excellent async support
- Automatic API documentation (OpenAPI/Swagger)
- Native Pydantic validation
- Better Python SDK support for Vertex AI
- Type hints throughout

### Why TypeScript + React (Extension)?
- Type safety prevents bugs
- React for complex UI components
- Industry standard for extensions
- Great developer experience

## Development Workflow

### 1. Local Development
```bash
# Extension development
cd extension
npm install
npm run dev       # Start dev server with hot reload
npm run build     # Build for production

# Backend development
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Local development server
```

### 2. Testing
- Load unpacked extension in Chrome
- Navigate to support chat platform
- Verify DOM detection and UI injection
- Test API calls to backend (locally or Cloud Run)

### 3. Deployment
- Build extension → Upload to Chrome Web Store
- Build Docker image → Deploy to Cloud Run
- Configure secrets and environment variables

## Key Coding Patterns

### Content Script Pattern
```typescript
// Observe DOM changes for new messages
const observer = new MutationObserver((mutations) => {
  // Detect new customer messages
  // Extract context
  // Trigger suggestion request
});

observer.observe(chatContainer, {
  childList: true,
  subtree: true
});
```

### Message Passing Pattern
```typescript
// Content script → Background service worker
chrome.runtime.sendMessage({
  type: 'GET_SUGGESTION',
  payload: { context, platform }
});

// Background service worker listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SUGGESTION') {
    // Call backend API
    // Return suggestion
  }
});
```

### Vertex AI Integration Pattern (Python)
```python
# FastAPI endpoint calling Gemini
import vertexai
from vertexai.generative_models import GenerativeModel

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Get the model
model = GenerativeModel("gemini-1.5-pro")

# Generate content
response = model.generate_content(prompt)
suggestion_text = response.text
```

### FastAPI Endpoint Pattern
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class SuggestRequest(BaseModel):
    platform: str
    conversation_context: list[dict]
    user_preferences: dict | None = None

@app.post("/api/suggest-response")
async def suggest_response(request: SuggestRequest):
    try:
        # Process request
        suggestion = await generate_suggestion(request)
        return {"suggestions": [suggestion], "metadata": {...}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Important Constraints

### Chrome Extension Limitations
1. **Content Security Policy**: No inline scripts, no eval()
2. **CORS**: API calls must go through background service worker
3. **DOM Access**: Content scripts can access DOM, service workers cannot
4. **Storage**: Limited to chrome.storage API (not localStorage in service worker)
5. **Permissions**: Need explicit host permissions for each domain

### GCP Vertex AI Constraints
1. **Rate Limits**: 60 requests per minute (default)
2. **Token Limits**: Gemini 1.5 Pro (2M input, 8K output)
3. **Latency**: ~1-3 seconds per request
4. **Cost**: ~$0.00125 per 1K input tokens (Pro)

### Security Requirements
1. Never store customer data permanently
2. API keys must be encrypted
3. Use HTTPS only
4. Validate all inputs
5. Implement rate limiting

## Common Pitfalls to Avoid

1. **DOM Selector Brittleness**: Chat platforms update their HTML frequently
   - Solution: Use multiple fallback selectors
   - Make selectors configurable

2. **Memory Leaks**: Content scripts run indefinitely
   - Solution: Clean up observers and event listeners
   - Use WeakMap for DOM element references

3. **Race Conditions**: Multiple messages arriving simultaneously
   - Solution: Debounce requests
   - Queue management

4. **API Key Exposure**: Never commit API keys
   - Solution: Use Secret Manager
   - Environment variables only

5. **Cross-Origin Issues**: Content scripts can't make direct API calls
   - Solution: Route through background service worker

## Platform-Specific Notes

### Zendesk
- Uses iframe for chat widget
- Messages in `.chat-msg-text` elements
- Need to detect iframe load

### Intercom
- Shadow DOM usage (difficult to access)
- Messages in custom web components
- Requires special handling

### Generic Platforms
- Fallback to common patterns
- Look for message containers with specific attributes
- Allow user configuration

## Prompting Strategy for Gemini

### System Prompt Template
```
You are an AI assistant helping customer support agents respond to customer inquiries.

Context:
- Platform: {platform}
- Customer's recent messages: {messages}
- Agent's previous responses: {responses}

Generate a professional, empathetic response that:
1. Addresses the customer's specific concern
2. Provides clear next steps
3. Maintains a {tone} tone
4. Is approximately {length} in length

Response:
```

### Few-Shot Examples
Include 2-3 examples of good responses in the prompt to guide Gemini's output style.

## Monitoring & Debugging

### Extension Debugging
- Chrome DevTools → Extensions
- Check service worker logs
- Inspect content script context
- Monitor network requests

### Backend Debugging
- Cloud Logging for function logs
- Cloud Monitoring for metrics
- Error Reporting for exceptions
- Trace for performance

## Next Steps After Initial Design

1. Set up development environment
2. Create basic extension structure
3. Implement one platform (Zendesk) first
4. Build minimal backend with hardcoded responses
5. Integrate Vertex AI
6. Polish UI and add features
7. Add more platforms
8. Deploy and test with real users

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Vertex AI Gemini API](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Cloud Functions Docs](https://cloud.google.com/functions/docs)
