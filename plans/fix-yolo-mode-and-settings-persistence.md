# Feature Implementation Plan: Fix YOLO Mode Selection and Settings Persistence

## 📋 Todo Checklist
- [x] Fix service worker to handle all message types properly
- [x] Add background field to manifest.json for service worker
- [x] Update GoalConfig to persist goal state when saving
- [x] Fix ModeSelector button disabled logic
- [x] Ensure storage listeners properly clean up
- [x] Test YOLO mode activation flow end-to-end ✅ **PASSED**
- [x] Test settings persistence across popup close/reopen ✅ **PASSED**
- [ ] Test storage change listeners (Test 3)
- [ ] Test emergency stop functionality (Test 4)
- [ ] Test mode validation (Test 5)
- [ ] Final Review and Testing

## 🔍 Analysis & Investigation

### Codebase Structure

The extension has a well-structured architecture with three main contexts:
- **Content Scripts**: `extension/src/content/` - Injected into support chat pages
- **Background Service Worker**: `extension/src/background/` - Message routing and API communication
- **Popup/Options UI**: `extension/src/popup/` and `extension/src/options/` - React-based configuration

### Current Architecture

**Key Files Inspected:**
1. `extension/src/popup/App.tsx` - Main popup component
2. `extension/src/popup/components/ModeSelector.tsx` - Mode switching UI (YOLO vs Suggestion)
3. `extension/src/popup/components/GoalConfig.tsx` - Goal configuration form
4. `extension/src/popup/components/Settings.tsx` - User preferences settings
5. `extension/src/lib/storage.ts` - Chrome storage wrapper with async functions
6. `extension/src/background/message-router.ts` - Message handler for background worker
7. `extension/src/background/mode-controller.ts` - Mode switching logic
8. `extension/src/background/goal-tracker.ts` - YOLO goal tracking
9. `extension/public/manifest.json` - Extension manifest
10. `extension/src/background/index.ts` - TypeScript background service worker (now properly compiled)
11. `extension/src/types/index.ts` - TypeScript type definitions

### Dependencies & Integration Points

**Chrome APIs Used:**
- `chrome.storage.local` - For persistent storage of preferences, mode, and YOLO state
- `chrome.runtime.sendMessage` - For communication between popup and background worker
- `chrome.tabs.sendMessage` - For broadcasting mode changes to content scripts
- `chrome.storage.onChanged` - For listening to storage changes

**React State Management:**
- Components use `useState` and `useEffect` hooks
- Storage listeners are set up in `useEffect` to sync state
- Components call storage functions from `@/lib/storage.ts`

### Issues Resolved ✅

**Issue 1: YOLO Mode Button Not Selectable** - ✅ **FIXED**

**Root Cause:**
1. The manifest.json was not properly registering the service worker
2. The build process was copying a mock `public/service-worker.js` instead of compiling the TypeScript version at `src/background/index.ts`
3. Messages like `SET_GOAL` were not being handled by the background worker

**Solution:**
1. Updated `manifest.json` to point to `src/background/index.ts`
2. Removed the manual copy plugin from `vite.config.ts`
3. The `@crxjs/vite-plugin` now properly compiles the TypeScript service worker
4. All message types (`SET_GOAL`, `SET_MODE`, etc.) are now handled correctly

**Issue 2: Settings Not Persisting** - ✅ **FIXED**

**Root Cause:**
1. The TypeScript background service worker was not being used
2. Storage operations were failing silently

**Solution:**
1. Proper service worker compilation ensures all storage operations work
2. Settings now persist correctly across popup close/reopen cycles

**Issue 3: Service Worker Configuration** - ✅ **FIXED**

**Solution:**
- Updated `manifest.json` to reference `src/background/index.ts`
- The build system (`@crxjs/vite-plugin`) now compiles TypeScript to `dist/service-worker.js`
- Service worker is properly registered and handles all message types

### Root Cause Summary (Historical)

1. ~~**Service Worker Not Properly Registered**~~ - ✅ FIXED: manifest.json now has proper `background` field
2. ~~**Wrong Service Worker Being Used**~~ - ✅ FIXED: Build process now compiles TypeScript version
3. ~~**Message Routing Broken**~~ - ✅ FIXED: All messages now route to proper handlers
4. ~~**State Not Updating**~~ - ✅ FIXED: Storage listeners work correctly
5. ~~**Goal State Not Created**~~ - ✅ FIXED: `SET_GOAL` messages create complete YoloState

## 📝 Implementation Summary

### Completed Steps ✅

#### Step 1: Add Service Worker to Manifest ✅
**Files modified**: `extension/public/manifest.json`

**Changes made**:
Added the `background` field to register the service worker:

```json
{
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  }
}
```

**Result**: Service worker is now properly registered and compiled by the build system.

---

#### Step 2: Update Build Configuration ✅
**Files modified**: `extension/vite.config.ts`

**Changes made**:
- Removed the manual `copy-service-worker` plugin
- The `@crxjs/vite-plugin` now handles compiling `src/background/index.ts` automatically

**Result**: Build process now compiles TypeScript service worker to `dist/service-worker.js` (14KB compiled).

---

#### Step 3: Service Worker Message Handling ✅
**Status**: Already implemented in `src/background/index.ts` and `src/background/message-router.ts`

The TypeScript service worker already handles all required message types:
- `SET_GOAL` - Creates YoloState in storage
- `SET_MODE` - Updates mode in storage and broadcasts to tabs
- `GET_MODE` - Retrieves current mode
- `SAVE_PREFERENCES` - Saves user preferences
- `GET_PREFERENCES` - Retrieves preferences
- `EMERGENCY_STOP` - Stops YOLO mode and clears state
- `UPDATE_GOAL_STATE` - Updates goal progress
- `GET_SUGGESTION` - Gets AI response suggestions
- `GET_AUTONOMOUS_RESPONSE` - Gets autonomous YOLO mode responses

---

## 🧪 Testing Strategy

### Test 1: YOLO Mode Activation Flow ✅ **PASSED**
**Purpose**: Verify that goal configuration enables YOLO mode activation and properly updates storage

**Steps**:
1. Open Chrome extension popup
2. Open Chrome DevTools → Application → Storage → Local Storage → chrome-extension://[id]
3. Verify no `yoloState` key exists initially
4. In popup, configure a goal:
   - Goal Type: "Resolve Issue"
   - Description: "Help customer with shipping delay"
   - Max Turns: 5
   - Keywords: "angry,manager,complaint"
5. Click "Save Goal"
6. Verify in storage that `yoloState` key now exists with complete state object
7. Verify YOLO Mode button is now **enabled** (not grayed out)
8. Click YOLO Mode button
9. Verify in storage that `mode` key is set to `"yolo"`
10. Verify button changes to orange and shows "YOLO Mode 🤖"

**Status**: ✅ **PASSED** - YOLO mode activates successfully after goal is configured.

---

### Test 2: Settings Persistence ✅ **PASSED**
**Purpose**: Verify that user preferences persist across popup close/reopen cycles

**Steps**:
1. Open extension popup
2. Change settings:
   - Tone: "Casual"
   - Length: "Long"
   - Language: "Spanish"
   - Check "Always include greeting"
3. Click "Save Settings"
4. Verify "Settings saved successfully!" message appears
5. **Close the popup** (click outside or press Escape)
6. **Reopen the popup**
7. Verify all settings are still set to:
   - Tone: "Casual"
   - Length: "Long"
   - Language: "Spanish"
   - Checkbox: Checked

**Status**: ✅ **PASSED** - Settings persist correctly across popup close/reopen cycles.

---

### Test 3: Storage Change Listeners 🔬
**Purpose**: Verify that React components automatically update when Chrome storage changes, testing the real-time synchronization between storage and UI

**Status**: ⏳ Pending

**Prerequisites**:
- Extension must be loaded and popup opened
- Background service worker must be running

**Detailed Test Steps**:

#### Part A: Test Background Message Logging
**What you're testing**: Message routing from popup to background worker

1. **Open Background Service Worker Console**:
   - Navigate to `chrome://extensions`
   - Find "Support Chat AI Assistant"
   - Click the blue "service worker" link (next to "Inspect views")
   - A new DevTools window opens - this is the background service worker console
   - Keep this window visible alongside your popup

2. **Test Settings Message**:
   - Click the extension icon to open the popup
   - In the popup, click "Save Settings" (you can use default settings)
   - **VERIFY in background console**: You should see a log entry:
     ```
     [Background] Received message: SAVE_PREFERENCES
     ```
   - If you see this, message routing is working ✅

3. **Test Goal Configuration Message**:
   - In the popup, configure a goal:
     - Goal Type: "Resolve Issue"
     - Description: "Test goal"
     - Max Turns: 3
     - Keywords: "test"
   - Click "Save Goal"
   - **VERIFY in background console**: You should see:
     ```
     [Background] Received message: SET_GOAL
     ```
   - If you see this, goal messages are routing correctly ✅

4. **Test Mode Change Message**:
   - Click the "YOLO Mode" button (should now be enabled)
   - **VERIFY in background console**: You should see:
     ```
     [Background] Received message: SET_MODE
     ```
   - If you see this, mode switching messages work ✅

#### Part B: Test Storage Listeners (Real-time UI Updates)
**What you're testing**: UI components automatically update when storage changes externally

1. **Setup**:
   - Ensure YOLO mode is **NOT** active (if it is, click "Suggestion Mode")
   - Keep the popup open
   - Open Chrome DevTools → Application → Storage → Local Storage → chrome-extension://[your-extension-id]

2. **Test Mode Change Listener**:
   - In the popup, observe the ModeSelector component - "Suggestion Mode" button should be blue
   - In DevTools Storage panel, find the `mode` key
   - **Manually change** the value from `"suggestion"` to `"yolo"` by:
     - Double-clicking the value
     - Typing `"yolo"` (keep the quotes)
     - Pressing Enter
   - **VERIFY in popup**: The UI should update immediately:
     - ✅ "YOLO Mode" button turns orange
     - ✅ Button text shows "YOLO Mode 🤖"
     - ✅ Description changes to "AI automatically responds to customers"
   - If UI updates without refreshing popup, listener works! ✅

3. **Test YoloState Listener**:
   - In the popup, observe the YOLO Mode button - it should be enabled
   - In DevTools Storage panel, find the `yoloState` key
   - **Manually delete** the `yoloState` key:
     - Right-click on `yoloState`
     - Select "Delete"
   - **VERIFY in popup**: The YOLO Mode button should become disabled (grayed out) immediately
   - **Manually add back** the `yoloState` key:
     - Right-click in the storage area
     - Add new entry: Key = `yoloState`, Value = `{"active":true,"goal":{"type":"resolve_issue","description":"test","max_turns":3}}`
   - **VERIFY in popup**: The YOLO Mode button should become enabled again
   - If button state changes without refreshing, listener works! ✅

4. **Test Preferences Listener**:
   - In the popup, scroll to Settings section
   - Note the current "Tone" setting
   - In DevTools Storage panel, find the `preferences` key
   - **Manually edit** the preferences:
     - Double-click the value (it's a JSON object)
     - Find `"tone"` field
     - Change value (e.g., from `"professional"` to `"casual"`)
     - Press Enter
   - **VERIFY in popup**: The Settings dropdown should update to show "Casual" immediately
   - If dropdown updates without refreshing, listener works! ✅

**Expected Behavior**:
- ✅ All components react to storage changes in real-time without manual refresh
- ✅ Background console shows all message types being received
- ✅ No JavaScript errors in popup console or background console

**Common Issues**:
- If listeners don't fire: Check that cleanup functions return properly in `storage.ts`
- If messages don't appear in background: Service worker may have terminated (click "service worker" link again)
- If UI doesn't update: Check browser console for React errors

---

### Test 4: Emergency Stop 🛑
**Purpose**: Verify that the emergency stop button immediately deactivates YOLO mode, clears state, and shows notification

**Status**: ⏳ Pending

**Prerequisites**:
- YOLO mode must be activated (complete Test 1 first)
- Extension must have `notifications` permission in manifest

**Detailed Test Steps**:

1. **Activate YOLO Mode** (if not already active):
   - Open extension popup
   - Configure a goal (if not configured):
     - Goal Type: "Resolve Issue"
     - Description: "Customer support assistance"
     - Max Turns: 5
     - Keywords: "angry,frustrated"
   - Click "Save Goal"
   - Click "YOLO Mode" button
   - **VERIFY**: Button turns orange and shows "YOLO Mode 🤖"

2. **Verify Emergency Stop Button Appears**:
   - Scroll down in the popup
   - **VERIFY**: You should see a red bordered section with a red button labeled "🛑 EMERGENCY STOP"
   - **Component behavior**: This button only appears when `mode === 'yolo'` (see `EmergencyStop.tsx:19-21`)
   - If you don't see the button, YOLO mode is not active

3. **Open Chrome DevTools** (to monitor storage changes):
   - Right-click in popup → "Inspect"
   - Go to Application tab → Storage → Local Storage → chrome-extension://[id]
   - **VERIFY before stopping**:
     - `mode` key = `"yolo"`
     - `yoloState` key exists with goal data

4. **Click Emergency Stop Button**:
   - Click the "🛑 EMERGENCY STOP" button
   - A confirmation dialog appears: "Are you sure you want to stop YOLO mode and take manual control?"
   - Click "OK"

5. **Verify Immediate UI Changes**:
   - **VERIFY in popup**:
     - ✅ ModeSelector switches back to "Suggestion Mode" (blue button)
     - ✅ Emergency Stop button disappears completely
     - ✅ YOLO Mode button becomes disabled (grayed out) since goal was cleared
     - ✅ Description changes to "AI suggests responses for you to review"

6. **Verify Storage Changes**:
   - **In DevTools Storage panel, verify**:
     - ✅ `mode` key is now `"suggestion"`
     - ✅ `yoloState` key is either deleted OR set to `null`
   - These changes should happen immediately after clicking OK

7. **Verify Chrome Notification** (if implemented):
   - **Check for system notification**: You should see a Chrome notification:
     - Title: "YOLO Mode Stopped" (or similar)
     - Message indicating manual control restored
   - **Note**: Notification requires `chrome.notifications.create()` in background worker
   - If no notification appears, check background service worker console for errors

8. **Verify Background Service Worker Logs**:
   - Go to `chrome://extensions` → Click "service worker" link
   - **VERIFY in console**: You should see:
     ```
     [Background] Received message: EMERGENCY_STOP
     ```
   - This confirms the message was received and processed

9. **Test Recovery - Re-enable YOLO Mode**:
   - In popup, configure a new goal
   - Click "Save Goal"
   - **VERIFY**: YOLO Mode button becomes enabled again
   - Click "YOLO Mode"
   - **VERIFY**: Emergency Stop button reappears

**Expected Behavior**:
- ✅ Emergency stop immediately deactivates YOLO mode
- ✅ Mode switches back to "Suggestion Mode"
- ✅ Chrome notification appears (if implemented)
- ✅ `yoloState` is cleared from storage
- ✅ `mode` is set to `"suggestion"` in storage
- ✅ Emergency Stop button disappears when not in YOLO mode
- ✅ User can re-configure goal and re-activate YOLO mode after stop

**Common Issues**:
- If notification doesn't appear: Check manifest has `"notifications"` permission
- If state doesn't clear: Check `EMERGENCY_STOP` handler in `message-router.ts`
- If button doesn't disappear: Check mode state is updating in `EmergencyStop.tsx`

---

### Test 5: Mode Validation 🔒
**Purpose**: Verify that YOLO mode cannot be activated without a configured goal, enforcing safety requirements

**Status**: ⏳ Pending

**Prerequisites**:
- Extension must be loaded in Chrome
- Fresh state (clear all storage first)

**Detailed Test Steps**:

1. **Clear All Storage** (Start with clean slate):
   - Open `chrome://extensions`
   - Find "Support Chat AI Assistant"
   - Click "Details"
   - Scroll down to "Storage" section
   - Click "Clear storage" button
   - **VERIFY**: A confirmation appears showing the amount of data to clear
   - Click "Clear"
   - **RESULT**: All extension storage is now empty

2. **Open Extension Popup**:
   - Click the extension icon in Chrome toolbar
   - Popup should open showing default state

3. **Verify Initial State**:
   - Open Chrome DevTools → Application → Storage → Local Storage → chrome-extension://[id]
   - **VERIFY**:
     - ✅ No `yoloState` key exists
     - ✅ `mode` is either not set OR set to `"suggestion"`
   - In popup, observe ModeSelector:
     - ✅ "Suggestion Mode" button is active (blue)
     - ✅ "YOLO Mode" button is grayed out (disabled)

4. **Test YOLO Mode Button Disabled State**:
   - Try to click the "YOLO Mode" button
   - **VERIFY**:
     - ✅ Button does not respond to clicks
     - ✅ Button has `disabled` attribute (inspect element to confirm)
     - ✅ Button appears visually disabled (gray background, likely with reduced opacity)
   - **Code reference**: `ModeSelector.tsx:62` has `disabled={!yoloState?.goal}`

5. **Test Click Without Goal Shows Alert**:
   - The button is disabled, so clicking shouldn't trigger anything
   - However, if you manually enable it via DevTools, clicking should show:
     - Alert: "Please configure a goal before activating YOLO mode"
   - **Code reference**: `ModeSelector.tsx:25-28`

6. **Configure a Partial Goal** (test validation):
   - In popup, scroll to "Goal Configuration" section
   - Fill in ONLY the description field:
     - Description: "Test goal"
   - **Do NOT fill in** Goal Type or Max Turns
   - Click "Save Goal"
   - **VERIFY**:
     - ✅ Alert appears indicating validation failed (if validation implemented)
     - ✅ YOLO Mode button remains disabled
     - ✅ No `yoloState` created in storage

7. **Configure a Complete Goal**:
   - Fill in ALL required fields:
     - Goal Type: "Resolve Issue"
     - Description: "Help customer with order"
     - Max Turns: 3
     - Keywords: "refund,cancel"
   - Click "Save Goal"
   - **VERIFY**: Alert appears: "Goal configured! You can now activate YOLO mode."

8. **Verify YOLO Mode Button Becomes Enabled**:
   - Observe the YOLO Mode button
   - **VERIFY**:
     - ✅ Button is now enabled (not grayed out)
     - ✅ Button background changes to light gray (normal state)
     - ✅ Button is now clickable
   - **In DevTools Storage**:
     - ✅ `yoloState` key now exists
     - ✅ `yoloState.goal` contains the goal data

9. **Test Mode Activation Works**:
   - Click the "YOLO Mode" button
   - **VERIFY**:
     - ✅ Button turns orange
     - ✅ Button shows "YOLO Mode 🤖"
     - ✅ `mode` in storage is now `"yolo"`
     - ✅ No alert appears (successful activation)

10. **Test Goal Deletion Re-disables Button**:
    - While in YOLO mode, manually delete `yoloState` from storage:
      - In DevTools → Storage → Local Storage
      - Find `yoloState` key
      - Right-click → Delete
    - **VERIFY in popup**:
      - ✅ YOLO Mode button becomes disabled immediately
      - ✅ Mode may switch back to Suggestion (depending on implementation)
    - This tests that the listener properly disables the button when goal is removed

11. **Test Goal Requirement Persistence**:
    - Close the popup (click outside)
    - Reopen the popup
    - **VERIFY**:
      - ✅ YOLO Mode button is still disabled (since goal was deleted)
      - ✅ State persists correctly across popup sessions

**Expected Behavior**:
- ✅ Cannot activate YOLO mode without a configured goal
- ✅ YOLO Mode button is disabled (grayed out) when no goal exists
- ✅ Clicking disabled button shows alert: "Please configure a goal before activating YOLO mode"
- ✅ Button becomes enabled immediately after goal is saved
- ✅ Button becomes disabled again if goal is deleted
- ✅ Validation works consistently across popup close/reopen cycles

**Code Logic Being Tested**:
```typescript
// ModeSelector.tsx:62 - Button disabled attribute
disabled={!yoloState?.goal}

// ModeSelector.tsx:25-28 - Click handler validation
if (newMode === 'yolo' && !yoloState?.goal) {
  alert('Please configure a goal before activating YOLO mode')
  return
}
```

**Common Issues**:
- If button is not disabled: Check `yoloState` in storage - it may have stale data
- If button doesn't re-enable after goal save: Check `onYoloStateChange` listener is firing
- If validation alert doesn't show: The disabled attribute prevents clicking entirely (expected behavior)

---

## 🎯 Success Criteria

### Core Functionality ✅
1. ✅ **YOLO Mode Selectable**: The YOLO Mode button becomes enabled immediately after saving a goal configuration
2. ✅ **Settings Persist**: User preference settings (tone, length, language, greeting) persist across popup close/reopen
3. ✅ **Service Worker Handles Messages**: The background service worker successfully handles all message types:
   - `SET_GOAL` - Creates YoloState in storage
   - `SET_MODE` - Updates mode in storage
   - `SAVE_PREFERENCES` - Saves preferences to storage
   - `EMERGENCY_STOP` - Clears YOLO state and switches mode
4. ✅ **Goal State Complete**: YoloState object has all required fields (active, goal, goalState, safetyConstraints, conversationId)
5. ✅ **Build System Works**: Extension builds successfully with proper service worker compilation

### Remaining Tests ⏳
6. ⏳ **Storage Listeners Work**: React components automatically update when storage changes (Test 3)
7. ⏳ **No Console Errors**: No errors in popup console or service worker console during normal operation
8. ⏳ **Cleanup Functions Work**: Storage listeners are properly cleaned up when components unmount (no memory leaks)
9. ⏳ **Mode Validation**: Cannot activate YOLO mode without a configured goal (Test 5)
10. ⏳ **Emergency Stop Works**: Can immediately stop YOLO mode and return to suggestion mode (Test 4)

---

## 🚨 Additional Considerations

### Service Worker Lifecycle
- Manifest V3 service workers can terminate after 30 seconds of inactivity
- All state must be persisted to `chrome.storage`
- No in-memory state should be relied upon between message calls

### Build System Notes
- The `@crxjs/vite-plugin` automatically compiles TypeScript service workers
- Source: `src/background/index.ts` → Output: `dist/service-worker.js`
- No manual copying required - the plugin handles everything

### Testing Tips
- **Always check background service worker console** for message logs and errors
- **Use Chrome DevTools Storage panel** to manually verify state changes
- **Keep popup open during tests** to observe real-time UI updates
- **Test both manual and programmatic storage changes** to verify listeners
- **Verify cleanup** by checking for duplicate listeners after popup reopen

### Future Improvements (Not in this plan)
1. **State Management**: Consider using a state management library (Redux, Zustand) for complex state
2. **Optimistic UI Updates**: Update UI immediately, then sync with storage
3. **Error Boundaries**: Add React error boundaries to catch component errors
4. **E2E Tests**: Add Playwright tests for full user flows
5. **Enhanced Logging**: Add structured logging for better debugging
6. **Integration Tests**: Automated tests for storage listeners and message routing

### Known Limitations
- Mock AI responses only (no real Vertex AI integration yet)
- No offline support for settings changes
- Service worker logs visible in DevTools background worker console
- Notifications may not appear on all systems (depends on OS notification permissions)

---

## 📊 Test Results Summary

| Test | Status | What It Tests | Notes |
|------|--------|---------------|-------|
| YOLO Mode Activation Flow | ✅ PASSED | Goal configuration and mode activation | Goal creation and mode switching work correctly |
| Settings Persistence | ✅ PASSED | Storage persistence across sessions | Settings saved and restored properly |
| Storage Change Listeners | ⏳ Pending | Real-time UI synchronization | Tests `onModeChange`, `onYoloStateChange`, `onPreferencesChange` listeners |
| Emergency Stop | ⏳ Pending | Emergency shutdown functionality | Tests YOLO mode deactivation and state cleanup |
| Mode Validation | ⏳ Pending | Goal requirement enforcement | Tests button disabled state and validation logic |

**Overall Progress**: 2/5 tests completed (40%)

**Next Steps**:
1. **Run Test 3**: Storage Change Listeners
   - Open background service worker console
   - Test message routing for all message types
   - Manually modify storage and verify UI updates in real-time

2. **Run Test 4**: Emergency Stop
   - Activate YOLO mode
   - Click emergency stop button
   - Verify mode switches, state clears, and notification appears

3. **Run Test 5**: Mode Validation
   - Clear all storage
   - Verify YOLO button is disabled without goal
   - Configure goal and verify button enables
   - Delete goal and verify button disables again

4. **Final Review**: Once all tests pass, conduct comprehensive review
5. **Mark Plan Complete**: Update checklist and move to completed plans folder

---

## 🔧 Troubleshooting Guide

### Background Service Worker Not Showing Messages
**Symptom**: Background console shows no logs when clicking buttons
**Solution**:
- Navigate to `chrome://extensions`
- Click "service worker" link to wake it up
- Service workers auto-terminate after 30 seconds of inactivity

### Storage Changes Not Updating UI
**Symptom**: Manually changing storage doesn't update popup UI
**Solution**:
- Check browser console for errors
- Verify `onChanged` listeners are set up in component `useEffect`
- Ensure cleanup functions return properly

### YOLO Mode Button Not Enabling After Goal Save
**Symptom**: Button stays grayed out even after saving goal
**Solution**:
- Check `yoloState` key exists in storage
- Verify `yoloState.goal` field is populated
- Check for errors in background service worker console
- Ensure `onYoloStateChange` listener is firing

### Emergency Stop Button Not Appearing
**Symptom**: Cannot find emergency stop button when in YOLO mode
**Solution**:
- Verify `mode` in storage is actually `"yolo"`
- Check popup console for React rendering errors
- Ensure `EmergencyStop` component is imported in `App.tsx`

### Storage Not Clearing
**Symptom**: Old data remains after "Clear storage"
**Solution**:
- Use Chrome's built-in clear storage: `chrome://extensions` → Details → Clear storage
- Alternatively, manually delete keys in DevTools Storage panel
- Check for storage writes happening after clear (race condition)
