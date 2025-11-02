# Feature Implementation Plan: Fix Service Worker `window` ReferenceError

## 📋 Todo Checklist
- [x] ~~Modify `src/lib/error-handler.ts` to use `self` instead of `window`.~~ ✅ Implemented
- [x] ~~Re-run the build to apply the fix.~~ ✅ Implemented
- [ ] Test that the extension loads without errors and that YOLO mode works.

## 🔍 Analysis & Investigation

### Root Cause Analysis
The error, `ReferenceError: window is not defined`, was caused by the `setupGlobalErrorHandler` function in `src/lib/error-handler.ts`. This function was called by the background script upon initialization.

The function attached global error listeners using `window.addEventListener`. However, Chrome extension service workers do not have access to the `window` object, as they run in a separate, non-DOM context. The global scope for a service worker is `self`.

Attempting to access `window` within the service worker's global scope resulted in the `ReferenceError` that crashed the script.

### Corrective Action
The fix was to replace the two instances of `window.addEventListener` in `setupGlobalErrorHandler` with `self.addEventListener`. The `self` keyword refers to the global scope in both window and worker contexts, making it a safe and compatible replacement that resolves the error while preserving the intended functionality.

## 📝 Implementation Plan

### Prerequisites
- All previous build process fixes should be in place.

### Step-by-Step Implementation

1. **Step 1**: Modify the Global Error Handler.
   - Files to modify: `extension/src/lib/error-handler.ts`
   - Changes needed: Replace both occurrences of `window.addEventListener` with `self.addEventListener`.
   - **Implementation Notes**: Successfully replaced both instances of `window` with `self` in the specified file.
   - **Status**: ✅ Completed

2. **Step 2**: Build the Extension.
   - Files to modify: None. This is a shell command.
   - Action: Run the build command from the `extension` directory to compile the change.
   - **Implementation Notes**: `npm run build` completed successfully.
   - **Status**: ✅ Completed

### Testing Strategy

1.  In Chrome, navigate to `chrome://extensions`.
2.  **Remove any old versions** of the extension.
3.  Click **"Load unpacked"** and select the **`extension/dist`** directory.
4.  **Verification 1 (Load Success):** Confirm that the extension loads without any errors.
5.  **Verification 2 (Error Gone):** Click the "Service Worker" link and check its console. Confirm that the `ReferenceError: window is not defined` error is **no longer present**.
6.  **Verification 3 (Original Bug Fix):**
    a. Open the extension popup.
    b. Configure and save a goal.
    c. Confirm the YOLO mode button becomes enabled and that the setting persists.

## 🎯 Success Criteria
- The extension loads successfully without the `window is not defined` error.
- The original YOLO mode state persistence bug is resolved, and the feature works as intended.