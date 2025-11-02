# Feature Implementation Plan: fix-build-errors

## 📋 Todo Checklist
- [ ] Fix missing `token_count` in Metadata mock objects (17 instances)
- [ ] Fix missing `started_at` in GoalState mock objects (5 instances)
- [ ] Remove unused variable declarations (8 instances)
- [ ] Fix type mismatches in callback functions
- [ ] Fix mock function signatures
- [ ] Verify build passes with no errors
- [ ] Run tests to ensure fixes don't break functionality
- [ ] Final Review and Testing

## 🔍 Analysis & Investigation

### Codebase Structure
The Chrome extension is built with TypeScript using Vite as the build tool. The project has:
- **Extension source**: `extension/src/` containing background workers, content scripts, popup/options UI
- **Type definitions**: `extension/src/types/index.ts` with all shared TypeScript interfaces
- **Test files**: Vitest tests colocated with source files (`.test.ts`, `.test.tsx` extensions)
- **Build process**: TypeScript compilation (`tsc`) followed by Vite build

### Current Architecture
Build errors are occurring in **test files only**, not in production code. The errors stem from:
1. Type definitions being strict (which is good)
2. Test mocks being created before all required fields were added to interfaces
3. TypeScript strict mode catching unused variables and type mismatches

### Error Categories Identified

#### 1. Missing `token_count` in Metadata Objects (17 occurrences)
The `Metadata` interface requires three fields:
```typescript
export interface Metadata {
  model_used: string
  latency: number
  token_count: number  // ← This field is missing in test mocks
}
```

**Affected files:**
- `src/background/message-router.test.ts`: Lines 102-105, 219-222
- `src/content/index.test.ts`: Lines 217-220, 386-389, 518-521, 571-574, 619-622, 663-666

**Pattern:** Test mocks create metadata objects like:
```typescript
metadata: {
  model_used: 'test-model',
  latency: 1.0
  // Missing: token_count
}
```

**Fix:** Add `token_count: 0` or a realistic value to all metadata mock objects.

#### 2. Missing `started_at` in GoalState Objects (5 occurrences)
The `GoalState` interface requires five fields:
```typescript
export interface GoalState {
  turns_taken: number
  info_gathered: string[]
  current_step: string
  started_at: number  // ← This field is missing in test mocks
  last_updated: number
}
```

**Affected files:**
- `src/background/message-router.test.ts`: Lines 198-203, 472-477
- `src/content/index.test.ts`: Lines 134-139, 339-344

**Pattern:** Test mocks create goal states like:
```typescript
goalState: {
  current_step: 'waiting',
  turns_taken: 0,
  info_gathered: [],
  last_updated: Date.now()
  // Missing: started_at
}
```

**Fix:** Add `started_at: Date.now()` or appropriate timestamp to all goal state objects.

#### 3. Unused Variables (8 occurrences)
TypeScript's `noUnusedLocals` flag is catching declared but unused variables.

**Affected locations:**
- `src/background/message-router.test.ts:3` - `SuggestRequest` imported but never used
- `src/background/message-router.test.ts:76` - `queryInfo` parameter never read
- `src/content/index.test.ts:229,275,308,399,475,530,581,629,673,712` - `platform` and `options` parameters never read in mock implementations
- `src/content/index.test.ts:756` - `cleanupCalled` variable declared but never read
- `src/options/components/YoloModeOptions.test.tsx:2` - `within` imported but never used

**Fix:** Either use the variables or prefix with underscore (`_platform`, `_options`) to indicate intentionally unused.

#### 4. Type Mismatches in Callbacks

**A. NewMessageCallback type mismatch (9 occurrences)**
File: `src/content/index.test.ts`
Lines: 230, 276, 309, 400, 476, 531, 582, 630, 674

**Issue:** Mock implementations don't return `Promise<void>`:
```typescript
// Expected type: (messages: Message[]) => Promise<void>
vi.mocked(createChatObserver).mockImplementation((platform, callback, options) => {
  handleNewMessages = callback  // Type 'NewMessageCallback' is not assignable
  return vi.fn()
})
```

**Fix:** Ensure the callback assignment matches the expected async signature.

**B. Possibly undefined response (2 occurrences)**
File: `src/content/index.test.ts`
Lines: 429, 444

**Issue:** `mockResponse.response` is possibly undefined (optional property in `AutonomousResponse`):
```typescript
expect(mockAutoResponder.sendResponse).toHaveBeenCalledWith(
  mockResponse.response.content,  // ← response is optional, could be undefined
  true
)
```

**Fix:** Add null-safety checks or non-null assertions where appropriate.

#### 5. Mock Function Signature Mismatches (3 occurrences)

**File:** `src/popup/components/EmergencyStop.test.tsx`
Lines: 18, 186, 199

**Issue:** The `onModeChange` function signature expects a cleanup function:
```typescript
// Actual signature from storage.ts:133
export function onModeChange(callback: (mode: 'suggestion' | 'yolo') => void): () => void

// Mock implementations returning wrong type:
vi.mocked(storage.onModeChange).mockImplementation(() => {})  // Returns void, not () => void
vi.mocked(storage.onModeChange).mockImplementation((callback) => {
  callback(/* ... */)
})  // Returns void, not () => void
```

**Fix:** Make mocks return a cleanup function: `() => () => {}`

### Dependencies & Integration Points
- **TypeScript**: Strict type checking enabled
- **Vitest**: Testing framework with vi.mock() for mocking
- **Chrome Extension APIs**: Mocked in tests via globalThis.chrome
- **Type system**: Centralized in `src/types/index.ts`

### Considerations & Challenges
1. **Test data realism**: Should add realistic values (e.g., `token_count: 150`) vs placeholder values (e.g., `token_count: 0`)
2. **Backwards compatibility**: Ensure fixes don't break existing test logic
3. **Type safety**: Maintain strict TypeScript checking while making mocks work
4. **Code patterns**: Follow existing mock patterns in the codebase

## 📝 Implementation Plan

### Prerequisites
- Node.js and npm installed
- Extension directory with `npm install` completed
- TypeScript and Vite build tools available

### Step-by-Step Implementation

#### Step 1: Fix Metadata Mock Objects (Add `token_count`)
**Files to modify:**
- `extension/src/background/message-router.test.ts`
- `extension/src/content/index.test.ts`

**Changes needed:**
For each metadata mock object, add the `token_count` field:

```typescript
// Before
metadata: {
  model_used: 'test-model',
  latency: 1.0
}

// After
metadata: {
  model_used: 'test-model',
  latency: 1.0,
  token_count: 150  // Realistic value for test
}
```

**Specific locations:**
- `message-router.test.ts` lines 102-105 (GET_SUGGESTION test)
- `message-router.test.ts` lines 219-222 (GET_AUTONOMOUS_RESPONSE test)
- `index.test.ts` line 217 (Suggestion mode flow test)
- `index.test.ts` line 386 (YOLO respond action test)
- `index.test.ts` line 518 (Low confidence test)
- `index.test.ts` line 571 (Escalate action test)
- `index.test.ts` line 619 (Goal complete test)
- `index.test.ts` line 663 (Need info test)
- All other similar metadata objects found

#### Step 2: Fix GoalState Mock Objects (Add `started_at`)
**Files to modify:**
- `extension/src/background/message-router.test.ts`
- `extension/src/content/index.test.ts`

**Changes needed:**
For each GoalState mock object, add `started_at: Date.now()`:

```typescript
// Before
goalState: {
  current_step: 'waiting',
  turns_taken: 0,
  info_gathered: [],
  last_updated: Date.now()
}

// After
goalState: {
  current_step: 'waiting',
  turns_taken: 0,
  info_gathered: [],
  started_at: Date.now(),
  last_updated: Date.now()
}
```

**Specific locations:**
- `message-router.test.ts` line 198 (GET_AUTONOMOUS_RESPONSE test - `mockRequest.goal_state`)
- `message-router.test.ts` line 472 (UPDATE_GOAL_STATE test - `updatedGoalState`)
- `index.test.ts` line 134 (YOLO initialization test - `mockYoloState.goalState`)
- `index.test.ts` line 339 (YOLO mode flow test - `mockYoloState.goalState`)
- Any inline goal state objects in test payloads

#### Step 3: Remove Unused Imports
**Files to modify:**
- `extension/src/background/message-router.test.ts`
- `extension/src/options/components/YoloModeOptions.test.tsx`

**Changes needed:**
```typescript
// message-router.test.ts line 3
// Before
import type { RuntimeMessage, SuggestRequest, AutonomousRequest, ... }
// After
import type { RuntimeMessage, AutonomousRequest, ... }  // Remove SuggestRequest

// YoloModeOptions.test.tsx line 2
// Before
import { render, screen, fireEvent, within } from '@testing-library/react'
// After
import { render, screen, fireEvent } from '@testing-library/react'  // Remove within
```

#### Step 4: Fix Unused Variables in Function Parameters
**Files to modify:**
- `extension/src/background/message-router.test.ts`
- `extension/src/content/index.test.ts`

**Changes needed:**
Prefix unused parameters with underscore to indicate intentional:

```typescript
// message-router.test.ts line 76
// Before
query: vi.fn((queryInfo, callback) => {
// After
query: vi.fn((_queryInfo, callback) => {

// index.test.ts multiple locations
// Before
vi.mocked(createChatObserver).mockImplementation((platform, callback, options) => {
// After
vi.mocked(createChatObserver).mockImplementation((_platform, callback, _options) => {

// index.test.ts line 756
// Before
let cleanupCalled = false
const mockCleanup = vi.fn(() => { cleanupCalled = true })
// After - Either use cleanupCalled in an assertion, or remove the variable:
const mockCleanup = vi.fn()
```

#### Step 5: Fix Callback Type Mismatches
**Files to modify:**
- `extension/src/content/index.test.ts`

**Changes needed:**
The issue is that `handleNewMessages` is being assigned directly to `callback`, but the types may not match. The actual implementation expects `(messages: Message[]) => Promise<void>`. Fix by ensuring the mock implementation properly handles the callback type:

```typescript
// Current problematic pattern (lines 230, 276, 309, etc.)
vi.mocked(createChatObserver).mockImplementation((platform, callback, options) => {
  handleNewMessages = callback
  return vi.fn()
})

// Fix: No changes needed to the implementation, but ensure handleNewMessages is typed correctly
// At the top of the test file (around line 57), the declaration should be:
let handleNewMessages: ((messages: Message[]) => Promise<void>) | undefined

// Or change the declaration to be explicit about accepting the callback type:
let handleNewMessages: (messages: Message[]) => Promise<void>
```

#### Step 6: Fix Possibly Undefined Response Properties
**Files to modify:**
- `extension/src/content/index.test.ts`

**Changes needed:**
Lines 429 and 444 access `mockResponse.response.content` but `response` is optional in `AutonomousResponse`. Add non-null assertions since we know the test sets it:

```typescript
// Line 429
// Before
expect(mockAutoResponder.sendResponse).toHaveBeenCalledWith(
  mockResponse.response.content,
  true
)

// After
expect(mockAutoResponder.sendResponse).toHaveBeenCalledWith(
  mockResponse.response!.content,
  true
)

// Line 444
// Before
expect.objectContaining({
  role: 'agent',
  content: mockResponse.response.content
})

// After
expect.objectContaining({
  role: 'agent',
  content: mockResponse.response!.content
})
```

#### Step 7: Fix onModeChange Mock Signatures
**Files to modify:**
- `extension/src/popup/components/EmergencyStop.test.tsx`

**Changes needed:**
The `onModeChange` function should return a cleanup function. Update mock implementations:

```typescript
// Line 18 (beforeEach setup)
// Before
vi.mocked(storage.onModeChange).mockImplementation(() => {})

// After
vi.mocked(storage.onModeChange).mockImplementation(() => () => {})

// Line 186
// Before
vi.mocked(storage.onModeChange).mockImplementation((callback) => {
  callback(newMode)
})

// After
vi.mocked(storage.onModeChange).mockImplementation((callback) => {
  callback(newMode)
  return () => {}
})

// Line 199 - This is calling the cleanup function that doesn't exist
// The cleanup function should be properly stored and called
// Need to see more context, but likely pattern:
// Before
vi.mocked(storage.onModeChange).mockImplementation(...)
// Later: cleanup() ← This expects onModeChange to have returned a function

// After - ensure mock returns a function and that function is captured:
const mockCleanup = vi.fn()
vi.mocked(storage.onModeChange).mockReturnValue(mockCleanup)
```

#### Step 8: Run Build and Verify
**Command:**
```bash
cd extension && npm run build
```

**Expected outcome:** Build completes with no TypeScript errors

**If errors persist:**
- Review error messages
- Check if any patterns were missed
- Ensure all mock objects match their interface definitions

### Testing Strategy

#### Unit Tests
After fixing build errors, run the test suite to ensure fixes don't break functionality:

```bash
cd extension
npm test
```

**Validation:**
- All existing tests should still pass
- No new test failures introduced
- Type checking passes without errors

#### Manual Verification
1. **Build verification**: Run `npm run build` - should complete without errors
2. **Type checking**: Run `tsc --noEmit` to verify TypeScript types independently
3. **Test execution**: Run `npm test` to ensure tests still work correctly
4. **Code review**: Verify that mock values are realistic and follow existing patterns

### Post-Fix Validation Checklist
- [ ] TypeScript compilation succeeds (`tsc`)
- [ ] Vite build succeeds (`vite build`)
- [ ] All unit tests pass (`npm test`)
- [ ] No new linting errors introduced
- [ ] Mock data values are realistic (e.g., token_count: 150, not 0)
- [ ] Code follows existing project patterns

## 🎯 Success Criteria

### Build Success
- Running `npm run build` in the extension directory completes without errors
- No TypeScript compilation errors (exit code 0)
- Build artifacts are generated successfully

### Type Safety Maintained
- All mock objects conform to their TypeScript interface definitions
- No use of `any` types or excessive type assertions
- Type checking remains strict

### Test Functionality Preserved
- All existing tests continue to pass
- Test coverage remains the same or improves
- Mock data is realistic and meaningful

### Code Quality
- Unused variables are removed or properly marked as intentionally unused
- Function signatures match their implementations
- Null safety is properly handled

### Documentation
- Code changes are self-documenting
- Mock values are realistic (e.g., `token_count: 150` instead of `token_count: 0`)
- No breaking changes to test patterns
