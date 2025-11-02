# Manual Testing Guide: Coinbase & Robinhood Support Chat

This guide explains how to manually test the Support Chat AI Assistant extension on Coinbase and Robinhood support chat interfaces.

## 🚀 Prerequisites

Before testing, ensure you have:
- Chrome browser installed
- Extension built and ready to load
- Access to Coinbase or Robinhood support chat

---

## Step 1: Build and Load the Extension

### Build the Extension
```bash
cd extension
npm run build
```

The build should complete successfully and create files in the `extension/dist` folder.

### Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions`
2. Enable **"Developer mode"** (toggle in top right corner)
3. Click **"Load unpacked"**
4. Navigate to and select the `extension/dist` folder
5. The extension should now appear in your extensions list with an icon

**Verification**:
- Extension icon appears in Chrome toolbar
- No errors shown on the extensions page
- Extension status shows "Errors: 0"

---

## Step 2: Navigate to Support Chat

### For Coinbase:
1. Go to https://www.coinbase.com/
2. Look for "Help" or "Contact Support" button
3. Open the support chat interface
4. Wait for chat to fully load

### For Robinhood:
1. Go to https://www.robinhood.com/
2. Find "Support" or "Help Center" link
3. Start a support chat
4. Wait for chat interface to initialize

**Note**: You may need to be logged in to access support chat on some platforms.

---

## Step 3: Test Extension Features

### A) Initial Setup - Open Extension Popup

1. **Click the extension icon** in Chrome toolbar
2. Extension popup should open showing:
   - Mode Selector (Suggestion Mode / YOLO Mode)
   - Goal Configuration section
   - Settings section
   - Current mode indicator

**Expected Behavior**:
- ✅ Popup opens without errors
- ✅ "Suggestion Mode" button is active (blue)
- ✅ "YOLO Mode" button is disabled (grayed out)
- ✅ No `yoloState` configured yet

---

### B) Test Suggestion Mode (Default)

**Suggestion Mode** = AI suggests responses that you manually review and send

1. **Start a conversation** in the support chat:
   - Type a test message (e.g., "I need help with my account")
   - Send the message

2. **Look for AI suggestion panel**:
   - Should appear near the chat interface
   - May show mock AI response suggestions

3. **Check browser console** (F12 → Console):
   - Look for extension logs
   - Check for any errors

**Expected Behavior**:
- ✅ Extension detects new messages in chat
- ✅ Background service worker processes messages
- ⚠️ AI suggestions may be mock responses (no real Vertex AI yet)

**Common Issues**:
- If no suggestion panel appears: Chat interface may not be detected yet
- Check console for "Chat interface not detected" messages
- Platform-specific DOM selectors may need configuration

---

### C) Test Goal Configuration

1. **Open extension popup** (click icon)
2. **Scroll to "Goal Configuration" section**
3. **Fill in goal details**:
   - **Goal Type**: Select "Resolve Issue"
   - **Description**: "Help customer with account question"
   - **Max Turns**: 5
   - **Keywords**: "angry,frustrated,complaint"

4. **Click "Save Goal"**

5. **Verify goal saved**:
   - Alert should appear: "Goal configured! You can now activate YOLO mode."
   - Open DevTools → Application → Local Storage → chrome-extension://[id]
   - Check that `yoloState` key exists with goal data

**Expected Behavior**:
- ✅ Goal saves successfully
- ✅ YOLO Mode button becomes enabled (not grayed out)
- ✅ Storage contains `yoloState` with complete goal object

---

### D) Test YOLO Mode (Autonomous Agent)

**YOLO Mode** = AI automatically responds to customer messages

⚠️ **Warning**: Only test in a safe environment! YOLO mode will auto-send responses.

1. **Ensure goal is configured** (from previous step)
2. **Click "YOLO Mode" button** in popup
3. **Verify mode activation**:
   - Button turns orange
   - Button text shows "YOLO Mode 🤖"
   - Description changes to "AI automatically responds to customers"

4. **Check storage**:
   - Open DevTools → Application → Local Storage
   - `mode` key should be set to `"yolo"`

5. **Monitor chat behavior**:
   - AI should automatically detect and respond to messages
   - Responses sent without manual approval
   - Turn counter increments

**Expected Behavior**:
- ✅ Mode switches to YOLO
- ✅ AI monitors chat for new messages
- ✅ Auto-responses generated (may be mock responses)
- ✅ Turn limit respected (max 5 turns in this example)

**Safety Features**:
- Emergency stop button appears (red)
- Turn limit prevents infinite loops
- Escalation keywords trigger safety stops

---

### E) Test Emergency Stop

**Purpose**: Immediately deactivate YOLO mode and return control to human

1. **While in YOLO mode**, scroll down in popup
2. **Find the red "🛑 EMERGENCY STOP" button**
3. **Click the button**
4. **Confirm in dialog**: Click "OK"

**Verify immediate effects**:
- ✅ Mode switches back to "Suggestion Mode" (blue button)
- ✅ Emergency Stop button disappears
- ✅ YOLO Mode button becomes disabled (goal cleared)
- ✅ In storage: `mode` = `"suggestion"`, `yoloState` = null

5. **Check notification** (may appear as system notification)
6. **Verify background logs**:
   - Go to `chrome://extensions` → Click "service worker"
   - Console should show: `[Background] Received message: EMERGENCY_STOP`

**Expected Behavior**:
- ✅ Instant deactivation of autonomous mode
- ✅ State cleared from storage
- ✅ Human control restored
- ✅ Can reconfigure goal and reactivate

---

### F) Test Settings Persistence

**Purpose**: Verify that user preferences persist across popup close/reopen

1. **Open extension popup**
2. **Scroll to "Settings" section**
3. **Change settings**:
   - **Tone**: Select "Casual"
   - **Length**: Select "Long"
   - **Language**: Select "Spanish"
   - Check **"Always include greeting"** checkbox

4. **Click "Save Settings"**
5. **Verify save message**: "Settings saved successfully!" appears

6. **Close the popup** (click outside or press Escape)

7. **Reopen the popup** (click extension icon)

8. **Verify settings retained**:
   - Tone: "Casual"
   - Length: "Long"
   - Language: "Spanish"
   - Checkbox: Still checked

**Expected Behavior**:
- ✅ Settings save to chrome.storage
- ✅ Settings persist after popup close
- ✅ Settings restored on popup reopen
- ✅ No data loss between sessions

---

### G) Test Storage Listeners (Real-time Updates)

**Purpose**: Verify UI updates automatically when storage changes

1. **Open extension popup**
2. **Open Chrome DevTools** (F12)
3. **Go to**: Application → Storage → Local Storage → chrome-extension://[id]

4. **Test Mode Change Listener**:
   - In storage panel, find `mode` key
   - Double-click value, change `"suggestion"` to `"yolo"`
   - Press Enter
   - **Verify in popup**: YOLO Mode button turns orange immediately

5. **Test YoloState Listener**:
   - Right-click `yoloState` key → Delete
   - **Verify in popup**: YOLO Mode button becomes disabled immediately
   - Add back: Right-click → Add new entry
     - Key: `yoloState`
     - Value: `{"active":true,"goal":{"type":"resolve_issue","description":"test","max_turns":3}}`
   - **Verify**: Button becomes enabled again

6. **Test Preferences Listener**:
   - Find `preferences` key
   - Double-click value
   - Change `"tone"` field from `"professional"` to `"casual"`
   - Press Enter
   - **Verify in popup**: Settings dropdown shows "Casual"

**Expected Behavior**:
- ✅ UI updates in real-time without manual refresh
- ✅ Storage listeners fire on every change
- ✅ No JavaScript errors in console
- ✅ Cleanup functions prevent memory leaks

---

### H) Test Mode Validation (Safety)

**Purpose**: Ensure YOLO mode cannot activate without a goal

1. **Clear all storage**:
   - Method 1: DevTools → Application → Local Storage → Right-click → Clear
   - Method 2: Console: `chrome.storage.local.clear(() => console.log('Cleared'))`

2. **Open extension popup**

3. **Verify initial state**:
   - "Suggestion Mode" is active (blue)
   - "YOLO Mode" is disabled (grayed out)
   - Cannot click YOLO Mode button

4. **Try to activate YOLO without goal**:
   - Button should not respond to clicks
   - Hover should show disabled state

5. **Configure complete goal**:
   - Goal Type: "Resolve Issue"
   - Description: "Help customer"
   - Max Turns: 3
   - Keywords: "test"
   - Click "Save Goal"

6. **Verify button enables**:
   - YOLO Mode button becomes clickable
   - Click button → Successfully activates

**Expected Behavior**:
- ✅ Safety validation enforced
- ✅ Cannot bypass goal requirement
- ✅ Button disabled state clear to user
- ✅ Validation works across sessions

---

## 📊 Test Results Checklist

Use this checklist to track your testing progress:

### Core Functionality
- [ ] Extension loads in Chrome without errors
- [ ] Extension detects Coinbase/Robinhood support chat
- [ ] Popup UI displays correctly
- [ ] Mode selector works (Suggestion ↔ YOLO)

### Suggestion Mode
- [ ] AI suggestions appear (or mock responses)
- [ ] Can manually review and send suggestions
- [ ] No automatic sending

### YOLO Mode
- [ ] Cannot activate without goal configured
- [ ] Goal configuration saves successfully
- [ ] YOLO mode activates after goal set
- [ ] Auto-responses generated
- [ ] Turn limit respected
- [ ] Emergency stop works

### Settings & Persistence
- [ ] Settings save successfully
- [ ] Settings persist across popup close/reopen
- [ ] Storage listeners update UI in real-time
- [ ] No console errors during operation

### Safety Features
- [ ] Goal requirement enforced
- [ ] Emergency stop immediately deactivates
- [ ] State cleared after emergency stop
- [ ] Can reconfigure and reactivate

---

## ⚠️ Known Limitations

### What Works ✅
- Extension loads on Coinbase/Robinhood domains
- UI components (popup, settings, mode selector)
- Storage persistence (settings, goals, mode)
- Message routing between components
- All safety features (emergency stop, validation)
- Real-time storage synchronization
- 260 automated tests passing

### What May NOT Work Yet ⚠️
- **AI Responses**: Plan notes indicate "Mock AI responses only (no real Vertex AI integration yet)"
- **Chat Detection**: May need custom DOM selectors for specific chat interfaces
- **Platform Selectors**: Each chat platform has unique HTML structure
- **Auto-response Injection**: Requires platform-specific DOM manipulation

---

## 🐛 Troubleshooting

### Extension Not Loading
**Symptom**: Extension doesn't appear after loading
**Solution**:
- Check for build errors: `npm run build`
- Verify `dist` folder exists and contains files
- Check `chrome://extensions` for error messages
- Reload extension: Click reload icon

### Chat Not Detected
**Symptom**: No suggestion panel appears in chat
**Solution**:
- Open DevTools (F12) → Console
- Look for: "Chat interface not detected"
- Check if chat uses Shadow DOM or iframe
- May need platform-specific configuration in `extension/src/content/platforms/`

### Service Worker Not Registering
**Symptom**: "Service worker registration failed"
**Solution**:
- Already fixed in plan: `fix-manifest.cjs` includes `type: "module"`
- Rebuild: `npm run build`
- Verify `dist/manifest.json` has:
  ```json
  "background": {
    "service_worker": "service-worker-loader.js",
    "type": "module"
  }
  ```

### No AI Responses
**Symptom**: Extension works but no AI suggestions
**Expected**: According to plan, AI backend not yet connected
**Solution**:
- This is normal - mock responses expected
- Real AI requires backend setup (Cloud Run + Vertex AI)
- See backend implementation plans for next steps

### Storage Not Persisting
**Symptom**: Settings lost after closing popup
**Solution**:
- Check browser console for storage errors
- Verify `chrome.storage` permission in manifest
- Test: `chrome.storage.local.get(console.log)` in console

### Background Service Worker Console
**How to access**:
1. Go to `chrome://extensions`
2. Find "Support Chat AI Assistant"
3. Click blue "service worker" link
4. New DevTools window opens
5. See background worker logs

**Expected logs**:
```
[Background] Received message: SET_GOAL
[Background] Received message: SET_MODE
[Background] Received message: SAVE_PREFERENCES
```

---

## 📝 Reporting Issues

If you encounter issues during testing, please document:

1. **Environment**:
   - Chrome version
   - Operating system
   - Website tested (Coinbase/Robinhood)

2. **Steps to Reproduce**:
   - Exact steps taken
   - Expected behavior
   - Actual behavior

3. **Console Errors**:
   - Browser console errors (F12)
   - Background service worker errors
   - Network tab errors

4. **Screenshots**:
   - Extension popup
   - Chat interface
   - Error messages

5. **Storage State**:
   - Export storage data: `chrome.storage.local.get(console.log)`
   - Include relevant keys: `mode`, `yoloState`, `preferences`

---

## 🎯 Success Criteria

**Minimal Success** (Core functionality working):
- ✅ Extension loads without errors
- ✅ Popup UI functional
- ✅ Can configure goals and switch modes
- ✅ Settings persist
- ✅ Emergency stop works

**Full Success** (All features working):
- ✅ Chat detection works on platform
- ✅ AI suggestions appear (mock or real)
- ✅ Auto-response in YOLO mode
- ✅ Real-time UI updates
- ✅ All safety features operational

---

## 📚 Related Documentation

- **Implementation Plan**: `complete-plans/fix-yolo-mode-and-settings-persistence.md`
- **Project Overview**: `CLAUDE.md`
- **Test Suite**: Run `npm test` in `extension/` directory
- **Build Instructions**: See `extension/README.md`

---

## ✅ Quick Start (TL;DR)

```bash
# 1. Build extension
cd extension
npm run build

# 2. Load in Chrome
# chrome://extensions → Developer mode → Load unpacked → Select dist/

# 3. Go to support chat
# https://www.coinbase.com or https://www.robinhood.com

# 4. Test features
# - Open extension popup
# - Configure goal
# - Switch to YOLO mode
# - Test emergency stop
# - Verify settings persist
```

---

**Happy Testing! 🚀**

For questions or issues, refer to the troubleshooting section or check the implementation plan for technical details.

**FAQ**

Can i test this on coinbase support or robinhood support chat now if I got to their web sites?? If how do i tests this? Summarize for me. 

⏺ Yes! You can test the extension on Coinbase or Robinhood support chat pages. Here's a quick guide:

  🚀 How to Test the Extension

  Step 1: Load the Extension in Chrome

  1. Build the extension (if not already built):
  cd extension
  npm run build
  2. Load in Chrome:
    - Open Chrome and go to chrome://extensions
    - Enable "Developer mode" (toggle in top right)
    - Click "Load unpacked"
    - Select the extension/dist folder
    - Extension should now appear with the icon

  Step 2: Navigate to Support Chat

  Go to one of these sites and open their support chat:
  - Coinbase: https://www.coinbase.com/ → Look for "Help" or "Contact Support" → Open chat
  - Robinhood: https://www.robinhood.com/ → Find "Support" or "Help Center" → Start a chat

  Step 3: Test the Features

  A) Suggestion Mode (Default)

  1. Start typing a message in the support chat
  2. The extension should detect the chat interface
  3. You should see AI suggestion panel appear (if chat is detected)
  4. AI will suggest responses based on conversation context

  B) YOLO Mode (Autonomous)

  1. Click the extension icon in Chrome toolbar
  2. Configure a Goal:
    - Goal Type: "Resolve Issue"
    - Description: "Help with account question"
    - Max Turns: 5
    - Keywords: "angry,frustrated"
  3. Click "Save Goal"
  4. Click "YOLO Mode" button (should now be enabled)
  5. The AI will automatically respond to customer messages

  C) Settings

  1. Open extension popup
  2. Configure preferences:
    - Tone: Professional/Casual
    - Length: Short/Medium/Long
    - Language: English/Spanish/etc.
  3. Click "Save Settings"
  4. Settings persist across sessions

  D) Emergency Stop

  1. While in YOLO mode, click extension icon
  2. Click "🛑 EMERGENCY STOP" button
  3. Confirms immediate deactivation
  4. Returns to Suggestion mode

  ---
  ⚠️ Important Limitations

  What Works Now:

  - ✅ Extension loads on Coinbase/Robinhood domains
  - ✅ UI components (popup, settings, mode selector)
  - ✅ Storage persistence (settings, goals, mode)
  - ✅ Message routing between components
  - ✅ All safety features (emergency stop, validation)

  What May NOT Work Yet:

  - ❌ AI Responses: The plan notes say "Mock AI responses only (no real Vertex AI integration yet)"
  - ❌ Chat Detection: The extension needs to detect the specific chat interface on each site
  - ❌ Platform Selectors: May need custom DOM selectors for Coinbase/Robinhood chat interfaces

  ---
  🔍 What You'll Actually See

  If Chat Detection Works:

  - Suggestion panel appears near chat interface
  - AI generates response suggestions (or mock responses)
  - You can review and send suggestions manually
  - YOLO mode auto-sends responses

  If Chat Detection Doesn't Work:

  - Extension loads but doesn't detect chat
  - No suggestion panel appears
  - Check browser console (F12) for errors
  - May need to add platform-specific selectors

  ---
  🛠️ Troubleshooting

  Extension Not Detecting Chat:

  1. Open DevTools (F12)
  2. Check Console for errors
  3. Look for: "Chat interface not detected" or similar
  4. Solution: May need to add custom selectors for that specific chat platform

  No AI Responses:

  - According to the plan: "Mock AI responses only (no real Vertex AI integration yet)"
  - You'll see placeholder/mock responses
  - Real AI requires backend setup (Cloud Run + Vertex AI)

  To Check What's Working:

  1. Open extension popup → Should show UI
  2. Configure goal → Should save to storage
  3. Switch modes → Should update button colors
  4. Open DevTools → Application → Local Storage → Check mode, yoloState, preferences keys

  ---
  📋 Quick Test Checklist

  □ Load extension in Chrome (chrome://extensions)
  □ Go to Coinbase or Robinhood
  □ Open support chat
  □ Check if extension detects chat interface
  □ Open extension popup (click icon)
  □ Configure a test goal
  □ Try switching between Suggestion/YOLO modes
  □ Check emergency stop works
  □ Verify settings persist after closing popup

  ---
  🎯 Expected Outcome

  Best Case:
  - Extension detects chat ✅
  - Shows suggestion UI ✅
  - Can toggle modes ✅
  - Settings persist ✅
  - (Mock AI responses for now)

  Most Likely:
  - Extension loads ✅
  - Popup UI works ✅
  - Chat detection may need custom configuration
  - Backend AI not connected yet (per plan notes)

  ---
  TL;DR: Load the extension, go to Coinbase/Robinhood support chat, open the extension popup to configure goals and test mode switching. Chat detection and real AI responses may need
  additional setup, but all core functionality (UI, storage, safety features) is working! 🚀

> put this plan to a file in docs called manual-test-coinbase-robinhood,md for coinbase & robinhood 

⏺ Bash(ls -la docs 2>/dev/null || echo "docs directory not found")
  ⎿  docs directory not found

⏺ Bash(mkdir -p docs && echo "docs directory created")
  ⎿  docs directory created

⏺ Write(~/git-projects/support-chat-ai/docs/manual-test-coinbase-robinhood.md)
  ⎿  Wrote 500 lines to ../docs/manual-test-coinbase-robinhood.md                                                                       
     # Manual Testing Guide: Coinbase & Robinhood Support Chat
     This guide explains how to manually test the Support Chat AI Assistant extension on Coinbase and Robinhood support chat interfaces.
     ## 🚀 Prerequisites
     Before testing, ensure you have:
     - Chrome browser installed
     - Extension built and ready to load
     - Access to Coinbase or Robinhood support chat
     … +490 lines (ctrl+o to expand)

⏺ Bash(ls -lh docs/manual-test-coinbase-robinhood.md && wc -l docs/manual-test-coinbase-robinhood.md)
  ⎿  Error: Exit code 1
     ls: docs/manual-test-coinbase-robinhood.md: No such file or directory

 ▐▛███▜▌   Claude Code v2.0.31
▝▜█████▛▘  Sonnet 4.5 · Claude Pro
  ▘▘ ▝▝    /Users/yannipeng/git-projects/support-chat-ai/extension
══════════════════════════════════════════════════════════════════════════ Conversation compacted · ctrl+o for history ═════════════════════════════════════════════════════════════════════════
  ⎿  Read ../docs/manual-test-coinbase-robinhood.md (500 lines)
  ⎿  Read src/popup/components/GoalConfig.test.tsx (236 lines)
  ⎿  Read src/lib/error-handler.ts (171 lines)

⏺ I'll verify the file creation was successful and confirm the documentation is in place.

⏺ Bash(ls -lh /Users/yannipeng/git-projects/support-chat-ai/docs/manual-test-coinbase-robinhood.md)
  ⎿  -rw-r--r--@ 1 yannipeng  primarygroup    14K Nov  2 01:27 /Users/yannipeng/git-projects/support-chat-ai/docs/manual-test-coinbase-robinhood.md

⏺ Perfect! The documentation file has been successfully created at /Users/yannipeng/git-projects/support-chat-ai/docs/manual-test-coinbase-robinhood.md (14KB).

  What's in the manual testing guide:

  Step-by-step testing procedures:
  1. Build & Load Extension - Instructions for building and loading in Chrome
  2. Navigate to Support Chat - How to access Coinbase and Robinhood support
  3. Test Suggestion Mode - Verify AI suggestions appear
  4. Test Goal Configuration - Save goals and verify storage
  5. Test YOLO Mode - Autonomous agent activation and monitoring
  6. Test Emergency Stop - Immediate deactivation and safety features
  7. Test Settings Persistence - Verify preferences persist across sessions
  8. Test Storage Listeners - Real-time UI updates when storage changes
  9. Test Mode Validation - Safety checks preventing YOLO without goals

  Additional sections:
  - ✅ Test Results Checklist (track your progress)
  - ⚠️ Known Limitations (what works vs. what may not work yet)
  - 🐛 Troubleshooting guide with solutions
  - 📝 Issue reporting template
  - 🎯 Success criteria

  Quick Start:
  cd extension
  npm run build
  # Then load in chrome://extensions → Load unpacked → Select dist/

  The guide is ready for you to use when testing on Coinbase or Robinhood support chat interfaces!