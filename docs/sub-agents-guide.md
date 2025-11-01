# Claude Agents Guide

## What Are Agents?

Agents (formerly called "sub-agents") are a feature of Claude Code that allows you to configure specialized AI assistants to handle specific tasks autonomously. They are defined in markdown files with YAML frontmatter in the `.claude/agents/` directory.

**Note:** This feature is specific to Claude Code.

## File Location

Agents go in the `.claude/agents/` directory (NOT in `.claude/commands/` or root `.claude/`):

```
.claude/
├── agents/
│   ├── code-review.md       ✅ Agent
│   ├── debugger.md          ✅ Agent
│   └── security-audit.md    ✅ Agent (example)
├── commands/
│   └── setup.md             ❌ Not an agent (slash command)
└── docs/
    └── tech-stack.md        ❌ Not an agent (documentation)
```

## File Format

Every agent file has two parts:

1. **YAML Frontmatter** (configuration)
2. **Markdown Body** (instructions)

### Example Structure

```markdown
---
name: agent-name
description: Short description of what this agent does
tools: Read, Grep, Glob, Bash, Write, Edit
model: inherit
---

Your detailed instructions for the agent go here.

Tell the agent:
- What its role is
- What to do when invoked
- How to structure its output
- What to check for
```

### Frontmatter Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `name` | Yes | Unique identifier for the agent | `code-reviewer` |
| `description` | Yes | What the agent does (shown when listing agents) | `Reviews code for quality and security` |
| `tools` | Yes | Which tools the agent can use | `Read, Grep, Glob, Bash` |
| `model` | Yes | Which model to use (`inherit` or specific model) | `inherit` |

### Available Tools

Your agent can use these tools:

- **Read** - Read files
- **Write** - Create new files
- **Edit** - Modify existing files
- **Glob** - Find files by pattern (e.g., `**/*.py`)
- **Grep** - Search file contents
- **Bash** - Run shell commands
- **Task** - Launch other agents
- **WebFetch** - Fetch web content
- **WebSearch** - Search the web

**Example:**
```yaml
tools: Read, Grep, Glob, Bash
# Agent can read files, search code, find files, run commands
# But CANNOT write/edit files
```

## How to Use Agents

### Method 1: Direct Invocation (Recommended)

```
You: Use the code-reviewer agent to review my changes

Claude Code will:
1. Load .claude/agents/code-review.md
2. Execute the agent's instructions
3. Return the review results
```

### Method 2: Automatic Proactive Use

Claude Code may automatically use agents when appropriate:
- After you write significant code → triggers code-reviewer
- When you ask about security → might use security-audit agent
- When debugging errors → might use debugger agent

## Your Current Agents

### code-reviewer

**File:** `.claude/agents/code-review.md`

**What it does:**
- Reviews TypeScript/Python code changes
- Checks Chrome extension Manifest V3 compliance
- Validates FastAPI async patterns
- Catches security issues (secrets, PII leaks)
- Ensures proper error handling and type annotations

**How to use:**
```
# After making code changes
You: Review my code changes

# Or be specific
You: Use code-reviewer to check the api-client.ts file

# Or after implementing a feature
You: I just added the Vertex AI integration, please review it
```

**What it checks:**
- Chrome Extension: Message passing, CORS constraints, service workers
- Python Backend: Async/await, Pydantic models, Vertex AI integration
- Security: No secrets in code, input validation, rate limiting
- Performance: Memory leaks, debouncing, caching
- Code Quality: Naming, function size, DRY principle

### debugger

**File:** `.claude/agents/debugger.md`

**What it does:**
- Root cause analysis for errors and test failures
- Captures error messages and stack traces
- Forms and tests hypotheses
- Implements minimal fixes with verification
- Provides prevention recommendations

**How to use:**
```
# When encountering errors
You: Debug this test failure

# Or be specific
You: Use debugger agent to fix this API error

# Or after seeing unexpected behavior
You: The extension isn't loading, help debug
```

**What it provides:**
- Root cause explanation with supporting evidence
- Specific code fixes
- Testing approach to verify the fix
- Prevention recommendations

## Creating More Agents

### Example: Security Audit Agent

Create `.claude/agents/security-audit.md`:

```markdown
---
name: security-audit
description: Security specialist that audits code for vulnerabilities, secrets, and privacy issues
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a security auditor specializing in Chrome extensions and cloud backends.

When invoked:
1. Search for potential secrets: grep -r "api[_-]?key|secret|token|password" --include="*.ts" --include="*.py"
2. Check for hardcoded credentials
3. Review authentication logic
4. Verify input validation
5. Check for customer data leaks

Focus on:
- API keys or tokens in code
- SQL injection vulnerabilities (if using raw queries)
- XSS vulnerabilities in extension
- CORS misconfiguration
- Sensitive data in logs
- Missing rate limiting

Report findings as:
- Critical: Immediate security risks
- High: Should fix before production
- Medium: Improve when possible
- Info: Best practices to consider
```

**Usage:**
```
You: Run a security audit on the backend
You: Use security-audit to check for exposed secrets
```

### Example: Test Generator Agent

Create `.claude/agents/test-generator.md`:

```markdown
---
name: test-generator
description: Generates comprehensive tests for TypeScript and Python code
tools: Read, Glob, Write, Edit
model: inherit
---

You are a test automation expert specializing in Vitest and pytest.

When invoked:
1. Identify the file to test
2. Read the source code
3. Generate appropriate tests:
   - For TypeScript: Use Vitest + React Testing Library
   - For Python: Use pytest with async support
4. Write tests to the appropriate test directory

Test requirements:
- Chrome Extension: Test message passing, DOM manipulation, API clients
- Python Backend: Test FastAPI endpoints, Pydantic validation, Vertex AI mocking
- Cover edge cases and error conditions
- Use proper mocking for external dependencies
- Follow existing test patterns in the project

For Python (pytest):
```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

@pytest.mark.asyncio
async def test_suggest_response():
    # Test implementation
    pass
```

For TypeScript (Vitest):
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('ApiClient', () => {
  it('should handle successful API call', async () => {
    // Test implementation
  })
})
```
```

**Usage:**
```
You: Generate tests for the gemini.py service
You: Use test-generator for the api-client.ts file
```

## Best Practices

### 1. Be Specific in Instructions

❌ Bad:
```markdown
You are a code reviewer. Review the code.
```

✅ Good:
```markdown
You are a code reviewer for Chrome extensions.

When invoked:
1. Run git diff to see changes
2. Check for Manifest V3 violations
3. Verify async message handlers return true
4. Look for CORS issues in content scripts

Output format:
🔴 Critical: [issue]
🟡 Warning: [issue]
🟢 Suggestion: [improvement]
```

### 2. Specify Tools Needed

Only include tools the agent actually needs:

```yaml
# Code reviewer (read-only)
tools: Read, Grep, Glob, Bash

# Test generator (needs to write)
tools: Read, Glob, Write, Edit

# Deployment agent (needs to run commands)
tools: Bash, Read
```

### 3. Include Project Context

Reference your project's patterns:

```markdown
Review against project-specific patterns from CLAUDE.md:
- Chrome extension must use Manifest V3
- Python backend uses FastAPI with async/await
- All API inputs validated with Pydantic
- No customer data stored permanently
```

### 4. Define Clear Output Format

Tell the agent how to structure results:

```markdown
Organize feedback by priority:

### 🔴 Critical Issues
- [List critical issues]

### 🟡 Warnings
- [List warnings]

### 🟢 Suggestions
- [List suggestions]

Include line numbers and code examples for each issue.
```

## Agents vs Slash Commands

| Feature | Agents | Slash Commands |
|---------|--------|----------------|
| **File location** | `.claude/agents/*.md` | `.claude/commands/*.md` |
| **Format** | YAML frontmatter + markdown | Markdown only |
| **Invocation** | "Use [name] agent" | `/command-name` |
| **Tools** | Can use tools autonomously | Instructions for main Claude |
| **Use case** | Automated tasks (review, test, audit, debug) | User-initiated workflows (setup, deploy) |

**Example:**

**Slash Command** (`.claude/commands/setup.md`):
```markdown
# Setup Project

Run these commands to initialize the project:

1. Create directories: mkdir -p extension/src backend/app
2. Initialize npm: cd extension && npm init
3. Install dependencies: pip install -r requirements.txt
```
→ Tells YOU (the user) or main Claude what to do

**Agent** (`.claude/agents/code-review.md`):
```yaml
---
name: code-reviewer
tools: Read, Grep, Bash
---

Run git diff and review changes for:
- Security issues
- Code quality
- Best practices
```
→ Agent executes autonomously with tools

## Debugging Agents

If your agent isn't working:

1. **Check the frontmatter syntax:**
   ```yaml
   ---
   name: my-agent
   description: Does something
   tools: Read, Bash
   model: inherit
   ---
   ```
   - Must have `---` delimiters
   - All fields required
   - Tools must be comma-separated

2. **Verify file location:**
   - Should be `.claude/agents/agent-name.md`
   - NOT in `.claude/commands/`
   - NOT in root `.claude/`

3. **Test invocation:**
   ```
   You: List available agents
   You: Use [agent-name] agent
   ```

4. **Check tool permissions:**
   - If agent needs to write files, include `Write` in tools
   - If agent needs to run commands, include `Bash` in tools

## Summary

Your project now has two specialized agents for Claude Code:

### code-reviewer (`.claude/agents/code-review.md`)
- ✅ Reviews Chrome extension code (Manifest V3, message passing, CORS)
- ✅ Reviews Python FastAPI code (async/await, Pydantic, Vertex AI)
- ✅ Checks security (secrets, input validation, rate limiting)
- ✅ Validates performance (memory leaks, debouncing, caching)
- ✅ Provides structured feedback (Critical/Warning/Suggestion)
- ✅ Includes specific line numbers and fix examples

**To use it:**
```
You: Review my code changes
You: Use code-reviewer to check the backend
You: I just finished the API client, please review it
```

### debugger (`.claude/agents/debugger.md`)
- ✅ Analyzes errors and stack traces
- ✅ Identifies reproduction steps
- ✅ Isolates failure locations
- ✅ Implements minimal fixes
- ✅ Verifies solutions work
- ✅ Provides prevention recommendations

**To use it:**
```
You: Debug this error
You: Use debugger agent to fix this test failure
You: This API call is failing, help me debug it
```

Both agents will automatically use the appropriate tools, run diagnostics, and provide detailed feedback based on your project's patterns!