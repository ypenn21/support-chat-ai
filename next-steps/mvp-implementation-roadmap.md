# Next Steps: MVP Implementation Roadmap

**Last Updated**: November 1, 2025
**Current Status**: Frontend Complete, Backend Implementation Pending
**Target MVP**: Coinbase & Robinhood Platform Support with AI-Powered Suggestion Mode

---

## Executive Summary

The Support Chat AI project has completed **Phase 1: Frontend Implementation** with all extension code, platform detection, and UI components fully built and tested. The immediate next step is **Phase 2: Backend Implementation** to integrate Google Vertex AI Gemini and provide real AI-powered response suggestions.

**Key Metrics:**
- ✅ **260/260 Tests Passing** (100% pass rate)
- ✅ **Frontend Type Definitions Updated** for Coinbase/Robinhood
- ✅ **Platform Detection Complete** with fallback selectors
- ✅ **Mock API Functional** for frontend testing
- ❌ **Backend API Routes** - Not yet implemented
- ❌ **Vertex AI Integration** - Not yet implemented

---

## Current Status: Completed Work

### Phase 1: Frontend Extension (100% Complete) ✅

**Completed Plans:**
1. **[chrome-extension-with-mock-backend.md](../complete-plans/chrome-extension-with-mock-backend.md)** - Full Chrome extension with React UI, platform detection, and mock API
2. **[refocus-mvp-platforms.md](../complete-plans/refocus-mvp-platforms.md)** - Platform refactoring from Zendesk/Intercom to Coinbase/Robinhood
3. **[fix-all-extension-tests.md](../complete-plans/fix-all-extension-tests.md)** - All 260 tests passing with comprehensive coverage

**What's Working:**
- ✅ **Platform Detection**: Automatically detects Coinbase, Robinhood, and generic chat platforms
- ✅ **DOM Observation**: MutationObserver monitors chat interfaces for new messages
- ✅ **UI Injection**: React-based suggestion panels inject into chat UIs
- ✅ **Mock API**: Fully functional mock backend for testing (generates realistic suggestions)
- ✅ **YOLO Mode Architecture**: AutoResponder and SafetyMonitor components ready
- ✅ **Popup & Options UI**: Complete React-based configuration interfaces
- ✅ **TypeScript Types**: All types aligned with backend Pydantic models
- ✅ **Test Coverage**: Comprehensive unit and component tests with 100% pass rate

**Platform Configuration:**
- ✅ Coinbase detector: Multiple fallback selectors for chat container, messages, input box
- ✅ Robinhood detector: Selector patterns for trading platform chat interface
- ✅ Generic detector: Fallback for unknown platforms using ARIA roles
- ✅ Manifest V3: Host permissions configured for `*.coinbase.com` and `*.robinhood.com`

**Recent Fixes (Nov 1, 2025):**
- Fixed all 9 failing tests with root cause analysis
- Corrected LiveMonitor message truncation logic
- Fixed EmergencyStop component mode change callbacks
- Resolved GoalConfig test cleanup issues
- Updated YoloModeOptions test element selection

---

## Phase 2: Backend Implementation (0% Complete) ⏳

### Critical Path: What Needs to Be Built

The backend is the **blocking dependency** for MVP completion. Without it, the extension cannot generate real AI suggestions.

**Current Backend Status:**
- ✅ **FastAPI Skeleton**: Basic app structure with CORS, health check
- ✅ **Pydantic Models**: Request/response models matching frontend types
- ✅ **Configuration System**: Settings management with environment variables
- ❌ **Vertex AI Service**: Not implemented
- ❌ **API Routes**: Only TODO comments exist
- ❌ **Prompt Engineering**: No prompt builder service
- ❌ **Context Processing**: No conversation analysis logic
- ❌ **Authentication**: No API key validation
- ❌ **Rate Limiting**: No abuse prevention

### Pending Plans

#### Plan 1: [Coinbase & Robinhood MVP Platform Support](../plans/coinbase-robinhood-mvp.md)

**Completion Status**: 14% (Step 1 of 7 complete)

| Step | Status | Description | Time Estimate |
|------|--------|-------------|---------------|
| 1. Type Definitions | ✅ Complete | Frontend types updated to include 'coinbase' \| 'robinhood' | - |
| 2. Vertex AI Integration | ⏳ Pending | Implement `GeminiService` with async Gemini API calls | 4-6 hours |
| 3. API Routes | ⏳ Pending | Create `/api/suggest-response` endpoint | 2-3 hours |
| 4. Selector Testing | ⏳ Pending | Validate DOM selectors on real platforms | 2-3 hours |
| 5. E2E Workflow | ⏳ Pending | Test full extension → backend → AI → UI flow | 2 hours |
| 6. Prompt Optimization | ⏳ Pending | Platform-specific prompt templates | 1-2 hours |
| 7. Documentation | ⏳ Pending | Deployment guide, troubleshooting docs | 1-2 hours |

**Why Backend Type Update Pending:**
- Frontend `extension/src/types/index.ts` updated ✅
- Backend `backend/app/models/request.py` still needs Platform enum update
- Blocked until backend implementation begins

#### Plan 2: [Backend Integration with FastAPI CRUD REST API](../plans/backend-integration-fastapi-crud.md)

**Completion Status**: 0% (Not started)

**Key Implementation Phases:**

**Phase 1: Core Backend Services (2-3 hours)**
- [ ] `backend/app/services/gemini.py` - Vertex AI Gemini integration
- [ ] `backend/app/services/prompt_builder.py` - Prompt engineering for Suggestion/YOLO modes
- [ ] `backend/app/services/context_processor.py` - Conversation analysis and entity extraction

**Phase 2: API Endpoints (2-3 hours)**
- [ ] `backend/app/api/routes/suggest.py` - POST `/api/suggest-response` (Suggestion Mode)
- [ ] `backend/app/api/routes/autonomous.py` - POST `/api/autonomous-response` (YOLO Mode)
- [ ] `backend/app/api/routes/feedback.py` - POST `/api/feedback` (User feedback collection)
- [ ] `backend/app/api/routes/logs.py` - GET/POST `/api/conversation-logs` (Analytics)
- [ ] `backend/app/main.py` - Register all routes with FastAPI app

**Phase 3: Security & Infrastructure (1-2 hours)**
- [ ] `backend/app/core/security.py` - API key authentication middleware
- [ ] `backend/app/middleware/rate_limit.py` - Rate limiting (60 req/min)
- [ ] `backend/app/core/database.py` - Firestore integration for analytics

**Phase 4: Extension Integration (1-2 hours)**
- [ ] Update `extension/src/background/api-client.ts` to call real API
- [ ] Replace mock API with production endpoints (keep mock as fallback)
- [ ] Add environment variables for `VITE_API_URL` and `VITE_API_KEY`

**Phase 5: Deployment (2-3 hours)**
- [ ] Build Docker image for Cloud Run
- [ ] Deploy to GCP Cloud Run with auto-scaling
- [ ] Configure Secret Manager for API keys
- [ ] Set up Cloud Logging and monitoring

**Phase 6: Testing & Validation (2-3 hours)**
- [ ] Backend unit tests (pytest with mocked Vertex AI)
- [ ] Integration tests (FastAPI TestClient)
- [ ] End-to-end tests with real extension
- [ ] Performance testing (target: <2s latency P95)

---

## Logical Next Step: Backend Implementation

### Why Backend First?

1. **Blocking Dependency**: Extension cannot generate real AI suggestions without backend
2. **Longest Task**: Backend implementation estimated at 10-15 hours total
3. **Independent Work**: Can be built and tested independently of frontend
4. **Platform Validation**: DOM selectors can be tested in parallel while backend is built
5. **Clear Deliverable**: Once backend is deployed, extension is immediately functional

### Recommended Order of Execution

**Week 1: Core Backend Development**

**Day 1-2: Vertex AI Service & Prompt Engineering (6-8 hours)**
```bash
# Priority 1: Get AI working
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Implement:
# 1. backend/app/services/gemini.py
# 2. backend/app/services/prompt_builder.py
# 3. backend/app/services/context_processor.py

# Test locally with:
uvicorn app.main:app --reload
```

**What to Build:**
- `GeminiService` class with async Gemini API calls
- Platform-aware prompt templates (Coinbase = crypto context, Robinhood = trading context)
- Conversation context formatter (last 10 messages, extract entities)
- Confidence score calculation (heuristic based on response length/coherence)

**Success Criteria:**
- Can generate suggestions locally for test conversation
- Prompts include platform-specific context
- Response format matches Pydantic `SuggestResponse` model

---

**Day 3: API Endpoints (4-5 hours)**
```bash
# Priority 2: Expose AI via API
# Implement:
# 1. backend/app/api/routes/suggest.py (Suggestion Mode)
# 2. backend/app/api/routes/autonomous.py (YOLO Mode - optional for MVP)
# 3. backend/app/main.py (route registration)

# Test with curl:
curl -X POST http://localhost:8080/api/suggest-response \
  -H "Content-Type: application/json" \
  -d '{"platform":"coinbase","conversation_context":[...]}'
```

**What to Build:**
- `/api/suggest-response` endpoint with full request validation
- Error handling (400 bad request, 500 internal error, 503 AI unavailable)
- Response formatting with metadata (confidence, latency, model used)
- Optional: `/api/autonomous-response` for YOLO mode (can defer to post-MVP)

**Success Criteria:**
- Endpoint returns valid `SuggestResponse` JSON
- Handles invalid input with proper error messages
- Logs requests to console for debugging

---

**Day 4: Security & Extension Integration (3-4 hours)**
```bash
# Priority 3: Make it production-ready
# Implement:
# 1. backend/app/core/security.py (API key auth)
# 2. Update extension/src/background/api-client.ts
# 3. Add .env configuration

# Test extension with backend:
cd extension
npm run dev
# Load unpacked extension in Chrome
# Navigate to Coinbase/Robinhood mock page
# Verify real AI suggestions appear
```

**What to Build:**
- API key authentication middleware (require `X-API-Key` header)
- Rate limiting (60 requests/minute per IP)
- Update extension to call real API with fallback to mock
- Environment variable configuration for `VITE_API_URL`

**Success Criteria:**
- Extension successfully calls backend and displays real AI suggestions
- Invalid API key returns 403 Forbidden
- Rate limit triggers after 60 requests

---

**Week 2: Deployment & Validation**

**Day 5: GCP Deployment (4-5 hours)**
```bash
# Priority 4: Deploy to production
# Setup GCP:
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Build and deploy:
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/support-chat-ai/backend:v1.0.0 .
docker push us-central1-docker.pkg.dev/PROJECT_ID/support-chat-ai/backend:v1.0.0
gcloud run deploy support-chat-ai --image=... --region=us-central1

# Update extension with production URL:
# .env.production: VITE_API_URL=https://your-cloud-run-url
```

**What to Do:**
- Enable required GCP APIs (Vertex AI, Cloud Run, Secret Manager)
- Create Artifact Registry repository for Docker images
- Deploy backend to Cloud Run with auto-scaling (1-10 instances)
- Configure environment variables and secrets
- Update extension with production API URL

**Success Criteria:**
- Cloud Run service deployed and healthy
- Extension works with production backend
- Vertex AI successfully generates suggestions
- Logs visible in Cloud Logging

---

**Day 6-7: Testing & Documentation (6-8 hours)**
```bash
# Priority 5: Validate & document
# Backend tests:
cd backend
pytest tests/ --cov=app

# E2E tests:
cd extension
npm run build
# Load extension in Chrome
# Test on real Coinbase/Robinhood platforms (if accessible)
# Test error scenarios (API down, invalid key, rate limit)

# Performance tests:
ab -n 100 -c 10 -p request.json https://your-cloud-run-url/api/suggest-response
```

**What to Do:**
- Write backend unit tests with mocked Vertex AI responses
- Create integration tests with FastAPI TestClient
- Perform end-to-end testing on real platforms
- Measure latency (target: P95 < 2 seconds)
- Document setup, deployment, troubleshooting

**Success Criteria:**
- 80%+ backend code coverage
- All tests passing (frontend + backend)
- E2E workflow validated
- Documentation complete

---

## Success Metrics for MVP

### Functional Requirements
- [ ] Extension activates on Coinbase and Robinhood domains
- [ ] Real AI suggestions generated via Vertex AI Gemini
- [ ] Suggestion appears within 2 seconds of customer message
- [ ] Suggestions are contextually relevant (crypto for Coinbase, trading for Robinhood)
- [ ] Copy/dismiss buttons work correctly
- [ ] Error handling graceful (shows user-friendly message if API fails)

### Non-Functional Requirements
- [ ] **Latency**: P95 response time < 2 seconds
- [ ] **Reliability**: 95%+ API success rate
- [ ] **Security**: API key authentication, no customer data stored permanently
- [ ] **Performance**: Extension memory usage < 50MB
- [ ] **Cost**: Vertex AI usage monitored, using Gemini Flash to minimize costs

### MVP Completion Checklist
- [ ] Backend API deployed to Cloud Run
- [ ] Extension connects to production backend
- [ ] Real AI suggestions working end-to-end
- [ ] Tests passing (frontend: 260/260, backend: TBD)
- [ ] Documentation complete (setup guide, API docs, troubleshooting)
- [ ] Known issues documented with workarounds

---

## Out of Scope for MVP (Post-MVP Features)

These features are architecturally ready but not required for initial launch:

1. **Autonomous YOLO Mode Backend**: Frontend complete, needs `/api/autonomous-response` endpoint
2. **Conversation Logging & Analytics**: Infrastructure ready, needs Firestore implementation
3. **Feedback Collection**: UI exists, needs `/api/feedback` endpoint
4. **Platform Selector Validation**: DOM selectors are speculative, need real-world testing
5. **Chrome Web Store Submission**: Extension packaging, privacy policy, screenshots
6. **Multi-Platform Expansion**: Support for additional platforms beyond Coinbase/Robinhood
7. **Advanced Prompt Optimization**: A/B testing, model fine-tuning based on feedback

---

## Risk Assessment

### High Risk
**Issue**: DOM selectors may not work on real Coinbase/Robinhood platforms
**Impact**: Extension won't detect chat interface or messages
**Mitigation**:
- Create mock test pages with actual platform HTML structure
- Test on real platforms ASAP (requires platform accounts)
- Add comprehensive fallback selectors
- Allow user-configurable custom selectors in options page

### Medium Risk
**Issue**: Vertex AI setup complexity (GCP configuration, service accounts, IAM)
**Impact**: Backend deployment may take longer than estimated
**Mitigation**:
- Follow official GCP Vertex AI quickstart guide
- Use default service account initially (simplest setup)
- Document each GCP setup step with troubleshooting notes
- Test locally with `gcloud auth application-default login` first

### Low Risk
**Issue**: Extension performance on low-end devices
**Impact**: Memory usage or lag in UI injection
**Mitigation**:
- Already tested: Extension uses <50MB RAM
- MutationObserver is debounced to 500ms
- React components use lazy loading where possible

---

## Estimated Timeline

**Total Time to MVP**: **2-3 weeks** (assuming full-time development)

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| **Week 1** | Backend Core Services | 6-8 hours | GCP project access |
| | API Endpoints | 4-5 hours | Core services complete |
| | Security & Integration | 3-4 hours | API endpoints complete |
| **Week 2** | GCP Deployment | 4-5 hours | Backend code complete |
| | Testing & Validation | 6-8 hours | Backend deployed |
| | Platform Selector Testing | 4-6 hours | Can run in parallel |
| | Documentation | 2-3 hours | All features complete |

**Critical Path**: Backend Implementation (15-18 hours total)

---

## Resources & References

### Completed Plans (What We Built)
- [Chrome Extension with Mock Backend](../complete-plans/chrome-extension-with-mock-backend.md) - Full extension architecture
- [Refocus MVP Platforms](../complete-plans/refocus-mvp-platforms.md) - Coinbase/Robinhood platform pivot
- [Fix All Extension Tests](../complete-plans/fix-all-extension-tests.md) - Test fixes and root causes

### Active Plans (What to Build Next)
- [Coinbase & Robinhood MVP](../plans/coinbase-robinhood-mvp.md) - Step 2-7 pending (backend focus)
- [Backend Integration FastAPI](../plans/backend-integration-fastapi-crud.md) - Complete backend implementation guide

### Project Documentation
- [CLAUDE.md](../CLAUDE.md) - Project overview, architecture, patterns
- [README.md](../README.md) - Quick start, features, setup instructions
- [SETUP.md](../SETUP.md) - Detailed GCP and local setup

### External Resources
- [Google Vertex AI Gemini Docs](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Pydantic Documentation](https://docs.pydantic.dev/latest/)

---

## Immediate Next Actions

**Start Here (This Week):**

1. **Set Up GCP Project** (30 minutes)
   ```bash
   gcloud projects create support-chat-ai
   gcloud services enable aiplatform.googleapis.com
   gcloud auth application-default login
   ```

2. **Implement Vertex AI Service** (4-6 hours)
   - Create `backend/app/services/gemini.py`
   - Test locally with simple prompt
   - Verify Gemini API responses

3. **Create Suggestion API Endpoint** (2-3 hours)
   - Implement `backend/app/api/routes/suggest.py`
   - Test with curl/Postman
   - Validate response format

4. **Connect Extension to Backend** (1-2 hours)
   - Update `extension/src/background/api-client.ts`
   - Add `.env` with local API URL
   - Test with mock Coinbase page

5. **Deploy to Cloud Run** (4-5 hours)
   - Build Docker image
   - Deploy to GCP
   - Test with production URL

**Target**: MVP functional by end of Week 2

---

## Questions & Decisions Needed

### Technical Decisions
- [ ] **Gemini Model Selection**: Use Gemini 1.5 Flash (cheaper, faster) or Pro (higher quality)?
  - Recommendation: Flash for Suggestion Mode, Pro for YOLO Mode
- [ ] **Firestore vs No Storage**: Store analytics metadata or run completely stateless?
  - Recommendation: Start stateless, add Firestore later if needed
- [ ] **Authentication Method**: API key in headers or JWT tokens?
  - Recommendation: API key (simpler for MVP, can upgrade later)

### Product Decisions
- [ ] **Platform Priority**: Test Coinbase or Robinhood first? (requires platform account)
  - Recommendation: Coinbase (more common use case, public chat support)
- [ ] **YOLO Mode in MVP**: Include autonomous mode or Suggestion Mode only?
  - Recommendation: Suggestion Mode only for MVP, YOLO post-MVP (safer launch)

---

## Conclusion

The Support Chat AI extension is **frontend-complete** and ready for backend integration. The critical path forward is implementing the FastAPI backend with Vertex AI Gemini to enable real AI-powered suggestions.

**Next Sprint Focus**: Build and deploy backend services to achieve functional MVP.

**Target Milestone**: End-to-end working system with real AI suggestions on Coinbase/Robinhood platforms within 2-3 weeks.

**Current Blockers**: None - all dependencies resolved, ready to start backend implementation.

---

**Document Owner**: Development Team
**Last Review**: November 1, 2025
**Next Review**: After backend implementation begins
