# Setup Verification Guide

This guide helps you verify that the project setup is complete and ready for development.

## ✅ Project Structure Created

### Extension (Chrome Extension)
```
extension/
├── src/
│   ├── background/          # Service worker files (to be created)
│   ├── content/             # Content scripts (to be created)
│   │   └── platforms/       # Platform-specific selectors
│   ├── popup/               # Popup UI (to be created)
│   │   └── components/      # Popup components
│   ├── options/             # Options page (to be created)
│   ├── components/          # Shared components
│   │   └── ui/              # shadcn UI components
│   ├── lib/                 # Utilities
│   │   └── utils.ts         ✅
│   ├── types/               # TypeScript types
│   │   └── index.ts         ✅
│   ├── styles/              # Global styles
│   │   └── globals.css      ✅
│   └── test/                # Test setup
│       └── setup.ts         ✅
├── public/
│   ├── manifest.json        ✅
│   └── icons/               # Extension icons (to be added)
├── package.json             ✅
├── tsconfig.json            ✅
├── tsconfig.node.json       ✅
├── vite.config.ts           ✅
├── tailwind.config.js       ✅
├── postcss.config.js        ✅
├── .eslintrc.cjs            ✅
├── .prettierrc              ✅
└── .env.example             ✅
```

### Backend (Python + FastAPI)
```
backend/
├── app/
│   ├── __init__.py          ✅
│   ├── main.py              ✅
│   ├── api/
│   │   ├── __init__.py      ✅
│   │   └── routes/
│   │       └── __init__.py  ✅
│   ├── core/
│   │   ├── __init__.py      ✅
│   │   └── config.py        ✅
│   ├── models/
│   │   ├── __init__.py      ✅
│   │   ├── request.py       ✅
│   │   └── response.py      ✅
│   ├── services/
│   │   └── __init__.py      ✅
│   └── middleware/
│       └── __init__.py      ✅
├── tests/
│   └── __init__.py          ✅
├── requirements.txt         ✅
├── requirements-dev.txt     ✅
├── pyproject.toml           ✅
├── Dockerfile               ✅
└── .env.example             ✅
```

### Root Files
```
├── README.md                ✅
├── CLAUDE.md                ✅
├── .gitignore               ✅
└── .claude/                 ✅ (already exists)
```

## 🚀 Next Steps

### 1. Install Extension Dependencies

```bash
cd extension
npm install
```

**Expected packages:**
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.0.11
- @crxjs/vite-plugin
- Tailwind CSS
- Zustand, React Query
- Testing libraries (Vitest, React Testing Library)

### 2. Install Backend Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Expected packages:**
- FastAPI 0.109.0
- Uvicorn 0.27.0
- Pydantic 2.5.0
- Google Cloud SDK packages
- Vertex AI SDK

### 3. Configure Environment Variables

#### Extension
```bash
cd extension
cp .env.example .env
# Edit .env and set:
# - VITE_API_URL (your Cloud Run URL or http://localhost:8080 for dev)
```

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env and set:
# - GCP_PROJECT_ID
# - Other GCP configuration
```

### 4. Verify Extension Setup

```bash
cd extension

# Type checking
npm run type-check
# Should complete without errors

# Start dev server
npm run dev
# Should start Vite dev server on port 5173
```

### 5. Verify Backend Setup

```bash
cd backend
source venv/bin/activate

# Start server
uvicorn app.main:app --reload --port 8080

# Test health endpoint
curl http://localhost:8080/health
# Expected: {"status":"healthy","version":"0.1.0","environment":"development"}
```

### 6. Load Extension in Chrome

1. Build the extension:
   ```bash
   cd extension
   npm run build
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable "Developer mode" (toggle in top-right)

4. Click "Load unpacked"

5. Select the `extension/dist` directory

6. Extension should appear in your extensions list

## 📝 What's Ready

### ✅ Complete
- [x] Project structure created
- [x] Package configuration files
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] ESLint & Prettier configuration
- [x] Vite configuration with Chrome extension plugin
- [x] FastAPI app structure
- [x] Pydantic models for API
- [x] Docker configuration
- [x] Environment variable templates
- [x] Testing setup
- [x] Git ignore configuration
- [x] README with full documentation

### 🔨 To Implement (use `/implement` command)
- [ ] Extension background service worker
- [ ] Extension content scripts
- [ ] Platform-specific DOM selectors (Zendesk, Intercom)
- [ ] React components for popup and options
- [ ] API client for calling backend
- [ ] FastAPI route handlers
- [ ] Vertex AI integration service
- [ ] Prompt builder service
- [ ] Authentication middleware
- [ ] Error handling middleware
- [ ] Unit and integration tests

## 🎯 Development Workflow

### Extension Development
```bash
cd extension
npm run dev        # Start dev server with hot reload
npm run lint       # Check code quality
npm test           # Run tests
npm run build      # Build for production
```

### Backend Development
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload   # Start with hot reload
pytest                          # Run tests
black app/                      # Format code
mypy app/                       # Type checking
```

### Using Claude Code

This project includes Claude Code configuration:

```bash
/setup          # ✅ Already run
/gcp-setup      # Configure GCP infrastructure
/implement      # Implement features
/review         # Code review
/test           # Generate tests
```

**Agents:**
- `code-reviewer` - Review code changes
- `debugger` - Debug errors

## 🔍 Verification Checklist

Run these commands to verify setup:

### Extension
- [ ] `cd extension && npm install` - No errors
- [ ] `npm run type-check` - No TypeScript errors
- [ ] `npm run lint` - No linting errors (or only warnings)
- [ ] `npm run dev` - Vite starts successfully
- [ ] `npm run build` - Builds successfully, creates dist/

### Backend
- [ ] `cd backend && python -m venv venv` - venv created
- [ ] `source venv/bin/activate && pip install -r requirements.txt` - All packages install
- [ ] `uvicorn app.main:app --reload` - Server starts on port 8080
- [ ] `curl http://localhost:8080/health` - Returns healthy status
- [ ] `curl http://localhost:8080/docs` - Shows API docs (Swagger UI)

## 🐛 Common Issues

### Extension Issues

**`Cannot find module '@/*'`**
- Solution: TypeScript path mapping is configured in tsconfig.json, restart VS Code

**`Module not found: @crxjs/vite-plugin`**
- Solution: Run `npm install` in the extension directory

**Tailwind classes not working**
- Solution: Ensure globals.css is imported in your root component

### Backend Issues

**`ModuleNotFoundError: No module named 'app'`**
- Solution: Ensure you're in the backend/ directory and venv is activated

**`ImportError: cannot import name 'settings'`**
- Solution: Check that .env file exists and GCP_PROJECT_ID is set

**Vertex AI authentication error**
- Solution: Run `gcloud auth application-default login`

## 📚 Documentation

- [README.md](./README.md) - Full project documentation
- [CLAUDE.md](./CLAUDE.md) - Claude Code instructions
- [.claude/README.md](./.claude/README.md) - Claude Code configuration
- [.claude/docs/](./.claude/docs/) - Detailed technical documentation

## 🎉 Success!

If all verification steps pass, your development environment is ready!

Next steps:
1. Start implementing features with `/implement`
2. Use `code-reviewer` agent to review your code
3. Follow the architecture defined in CLAUDE.md

Happy coding! 🚀
