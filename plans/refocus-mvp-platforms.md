# Feature Implementation Plan: Refocus MVP Platforms

## 📋 Todo Checklist
- [x] ~~Update project documentation (GEMINI.md, README.md)~~ ✅ Implemented
- [x] ~~Update Chrome Extension configuration (manifest.json)~~ ✅ Implemented
- [x] ~~Refactor platform-specific code for new targets~~ ✅ Implemented
- [x] ~~Update AI assistant command prompts~~ ✅ Implemented
- [x] ~~Final Review and Testing~~ ✅ Implemented

## 🔍 Analysis & Investigation

The goal is to pivot the project's initial MVP focus from Zendesk and Intercom to Coinbase and Robinhood. This requires a comprehensive update across documentation, configuration, and source code to reflect the new target platforms.

### Files Inspected
- **Documentation:** `GEMINI.md`, `README.md` - These files contain the primary description of the project and its targets.
- **Extension Configuration:** `extension/public/manifest.json` - This file defines the permissions and content script matching for the Chrome extension.
- **Platform-specific Code:** The `extension/src/content/platforms/` directory, containing `zendesk.ts`, `intercom.ts`, and `index.ts`. This is where the logic for detecting and interacting with specific platforms resides.
- **AI Assistant Prompts:** `.claude/commands/implement.md` - This file contains prompts for the AI assistant, which include examples of the target platforms.

### Current Architecture
The architecture is designed to be modular, with platform-specific logic isolated in the `extension/src/content/platforms/` directory. This makes it straightforward to add, remove, or change target platforms.

### Considerations & Challenges
- The DOM structure of Coinbase and Robinhood will be different from Zendesk and Intercom. The existing selectors will need to be replaced with new ones specific to the new platforms.
- The initial implementation will use placeholder selectors. A separate task will be required to find the correct selectors for the new platforms.

## 📝 Implementation Plan

### Step-by-Step Implementation

1.  **Update `GEMINI.md`**
    *   **Files to modify:** `GEMINI.md`
    *   **Changes needed:** In the "Project Overview & Purpose" section, change the primary goal to state that the initial MVP will focus on Coinbase and Robinhood.

2.  **Update `README.md`**
    *   **Files to modify:** `README.md`
    *   **Changes needed:**
        *   Update the main description to mention Coinbase and Robinhood.
        *   Update the "Key Features" section to reflect the new platforms.
        *   Update the API example to use `coinbase` as the platform.

3.  **Update Chrome Extension Manifest**
    *   **Files to modify:** `extension/public/manifest.json`
    *   **Changes needed:**
        *   In `host_permissions`, replace the Zendesk and Intercom URLs with `https://*.coinbase.com/*` and `https://*.robinhood.com/*`.
        *   In `content_scripts.matches`, update the URLs to match the new `host_permissions`.

4.  **Refactor Platform-Specific Code**
    *   **Files to modify:** `extension/src/content/platforms/`
    *   **Changes needed:**
        *   Rename `zendesk.ts` to `coinbase.ts`.
        *   Rename `intercom.ts` to `robinhood.ts`.
        *   In the new `coinbase.ts`, replace all instances of `zendesk` with `coinbase` and update the selectors to be placeholders for Coinbase.
        *   In the new `robinhood.ts`, replace all instances of `intercom` with `robinhood` and update the selectors to be placeholders for Robinhood.
        *   In `index.ts`, update the imports and logic to use the new `coinbaseDetector` and `robinhoodDetector`.

5.  **Update AI Assistant Prompts**
    *   **Files to modify:** `.claude/commands/implement.md`
    *   **Changes needed:** Update the platform-specific requirements to mention Coinbase and Robinhood instead of Zendesk and Intercom.

### Testing Strategy

1.  **Manual Testing:**
    *   Load the unpacked extension in Chrome.
    *   Navigate to `coinbase.com` and `robinhood.com` and verify that the content script is injected and attempts to run (e.g., by checking the console for logs).
    *   Navigate to `zendesk.com` and `intercom.com` and verify that the content script is no longer injected.
2.  **Unit Testing:**
    *   The existing unit tests for the platform detectors will likely fail. They should be updated to reflect the new platform logic.

## 🎯 Success Criteria

- All mentions of Zendesk and Intercom in the codebase and documentation are replaced with Coinbase and Robinhood where appropriate.
- The Chrome extension has the correct permissions to run on `coinbase.com` and `robinhood.com`.
- The platform detection logic is updated to look for Coinbase and Robinhood.
- The project is ready for the development of specific selectors and interaction logic for the new target platforms.
