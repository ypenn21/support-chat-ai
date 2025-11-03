### DOM-based XSS in `auto-responder.ts`

**Vulnerability:** Cross-Site Scripting (XSS)
**Severity:** High
**Location:** `extension/src/content/auto-responder.ts`
**Line Content:** `preview.innerHTML = ...`
**Description:** The `showPreview` function in `auto-responder.ts` uses `innerHTML` to render a preview of the AI-generated response. The `content` of the response is directly embedded in the HTML without any sanitization. An attacker who can control the AI's response could inject malicious HTML and script content, which would then be executed in the context of the user's browser.
**Recommendation:** Instead of using `innerHTML`, use `textContent` to set the content of the preview element. If the content needs to be formatted, use a library like `DOMPurify` to sanitize the HTML before setting it.