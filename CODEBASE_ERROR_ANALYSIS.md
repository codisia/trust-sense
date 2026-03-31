# Codebase Error Analysis Report
**Date:** March 30, 2026 | **Thorough Review:** Desktop App + Chrome Extension

---

## ⚠️ SUMMARY OF CRITICAL ISSUES

### Desktop App: **7 CRITICAL ERRORS** preventing launch
- Module import/export mismatch (CommonJS/ES6 conflict)
- Missing preload.js path handling
- IPC handler naming inconsistencies
- Undefined UI functions
- FormData unavailable in Node.js context

### Chrome Extension: **4 MAJOR ISSUES** preventing functionality
- Incomplete event listener implementations
- Missing API endpoint integration
- Undefined functions in popup.js
- Broken message passing between content/background

### Cross-Browser Support: **Requires complete manifest rewrite**
- Firefox needs MV3 compatibility updates
- Safari requires entitlements file
- Edge/Brave require manifest adjustments

---

## 1. DESKTOP APP ANALYSIS

### 🔴 CRITICAL ERROR #1: Module System Mismatch
**File:** [main.js](main.js#L10-L12)  
**Issue:** CommonJS `require()` importing ES6 `export default`

```javascript
// ❌ main.js line 12
const db = require('./src/database')

// ✅ database.js uses ES6 export
export default { settingsDB, historyDB, tagsDB, cacheDB, close: () => db.close() }
```

**Effect:** Runtime error on app startup: `TypeError: db.historyDB is not a function`  
**Fix:** Change database.js to CommonJS OR use proper ES6 import in main.js

---

### 🔴 CRITICAL ERROR #2: Incorrect Preload Path
**File:** [main.js](main.js#L55)  
**Issue:** Wrong preload.js path variable

```javascript
// ❌ Current (line 55)
preload: path.join(__dirname, 'src/preload.js'),  // Points to src/preload.js but file is in root

// ✅ Correct
preload: path.join(__dirname, 'preload.js'),
```

**Effect:** Preload script not loaded → `window.electronAPI` undefined → all IPC calls fail  
**Trace:** Main window loads, but cannot execute any analysis functions

---

### 🔴 CRITICAL ERROR #3: IPC Handler Name Mismatch
**File:** [main.js](main.js#L108) vs [preload.js](preload.js#L3)  

Name inconsistency:
```javascript
// preload.js (line 3) calls:
analyzeText: (content) => ipcRenderer.invoke('analyze-text', content)

// main.js (line 108) defines:
ipcMain.handle('analyze-text', async (event, { text }) => {
  // This expects { text }, but preload passes entire content object
```

**Additional mismatch:**
```javascript
// preload.js line 6 CALLS:
getAnalysisHistory: () => ipcRenderer.invoke('get-analysis-history')

// main.js DEFINES (different name):
ipcMain.handle('get-history', async (event) => {
```

**Effect:** All analysis calls fail silently or throw "Unknown IPC channel" errors

---

### 🔴 CRITICAL ERROR #4: FormData Not Available in Node.js
**File:** [main.js](main.js#L173-L176)  
**Issue:** Audio/video analysis handlers use FormData (browser API)

```javascript
// ❌ main.js line 175
const formData = new FormData()  // NOT available in Node.js
formData.append('file', file)
```

**Effect:** Runtime error when analyzing audio/video:
```
ReferenceError: FormData is not defined
```

**Fix:** Use native Node.js Buffer or install `form-data` package

---

### 🔴 CRITICAL ERROR #5: Missing Event Handler
**File:** [main.js](main.js#L39-U42)  
**Issue:** Sending event `unauthorized` but no listener

```javascript
// main.js line 40 - api interceptor sends:
mainWindow.webContents.send('unauthorized')

// But preload.js NEVER listens for this
// Should expose: onUnauthorized: (callback) => ipcRenderer.on('unauthorized', callback)
```

**Effect:** Unauthorized responses not handled properly in UI

---

### 🔴 CRITICAL ERROR #6: Undefined UI Functions
**File:** [renderer.js](renderer.js#L380-L390)  
**Issue:** Functions called but never defined

```javascript
// renderer.js calls these functions:
onclick="minimizeApp()"    // ❌ NOT DEFINED
onclick="openSettings()"   // ❌ NOT DEFINED

// These are defined:
shareResult()    // ✅ defined
exportResult()   // ✅ defined (incomplete)
```

**Effect:** Clicking buttons throws console errors; Windows won't minimize

---

### 🟡 CRITICAL ERROR #7: API Calling Inconsistency
**File:** [api.js](api.js#L1-U85)  
**Issue:** API module uses ES6 imports/exports but main.js uses CommonJS require

```javascript
// api.js (ES6):
export function setAuthToken(token) { ... }
export const authAPI = { ... }

// main.js (CommonJS):
const api = axios.create({ ... })  // Creates duplicate axios instance!
// Never imports exported functions from api.js
```

**Effect:** Duplicate API clients, inconsistent auth token handling

---

## 2. CHROME EXTENSION ANALYSIS

### 🔴 ISSUE #1: Incomplete Event Listeners
**File:** [background.js](background.js#L1-L10)  
**Issue:** Event listeners defined but do nothing

```javascript
// ❌ background.js
chrome.runtime.onInstalled.addListener(() => {
    console.log('TRUST SENSE extension installed or updated');
    // MISSING: Initialize default settings, load API URL from storage
});

chrome.tabs.onActivated.addListener(() => {
    console.log('Tab activated - ready to analyze');
    // MISSING: Update icon badge, enable/disable based on context
});
```

**Effect:** Extension doesn't auto-initialize settings; badge never updates

---

### 🔴 ISSUE #2: Broken Content-Background Message Passing
**File:** [content.js](content.js#L1-U11) ↔ [popup.js](popup.js#L108-U128)  
**Issue:** Missing message handlers

```javascript
// ❌ content.js - ONLY ONE MESSAGE TYPE handled
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') { ... }
    // MISSING: No handler for 'analyzeContent', 'sendResult', etc.
});

// ❌ popup.js - SENDS messages content.js doesn't handle
chrome.tabs.sendMessage(id, {action: 'getPageContent'})  // Works
// But where does analysis result get sent back? No handler!
```

**Effect:** One-way communication only; results can't flow back to popup

---

### 🔴 ISSUE #3: analyzeContent() Function Stubbed Out
**File:** [popup.js](popup.js#L35-L50)  

```javascript
// ❌ popup.js - Default stub implementation
if (typeof analyzeContent !== 'function') {
    function analyzeContent(content, url, title) {
        // Dummy analysis for UI testing
        return Promise.resolve({
            analysis: {
                trust_score: 75,  // HARDCODED!
                credibility: 80,
                // ... all dummy data
            }
        });
    }
}
```

**Effect:** Extension NEVER calls backend API; always shows fake score of 75

---

### 🔴 ISSUE #4: Missing API URL Configuration
**File:** [popup.js](popup.js#L66-U67)  
**Issue:** API_URL configuration but NEVER USED

```javascript
// ❌ popup.js line 66-67
const DEFAULT_API_URL = 'http://localhost:8000';
const DEFAULT_APP_URL = 'http://localhost:5173';

// Line 68-70
function getConfigValue(key, defaultValue) { ... }
function setConfigValue(key, value) { ... }

// But analyzeContent() never calls:
// fetch(`${API_URL}/api/analyze-text`, { body: JSON.stringify({text: content}) })
```

**Effect:** Extension never sends data to backend; always returns dummy results

---

### 🟡 ISSUE #5: Incomplete popup.js Implementation
**File:** [popup.js](popup.js#L60-U61)  
**Issue:** Function definitions but incomplete bodies

```javascript
// ❌ Line 60-61
function showError(message) { ... }  // Defined
function hideLoading() { ... }       // Defined
function showLoading() { ... }       // Defined

// But later called with different assumptions:
// Line 36-47: `showLoading()` assumes specific DOM IDs exist
// Line 12-19: DOM references might not exist
```

**Effect:** DOM manipulation fails if HTML structure doesn't match expectations

---

### 📋 Missing HTML Elements in popup.html
**Issue:** HTML references elements that might not exist

```html
<!-- popup.html defines these -->
<div id="loading">...</div>
<div id="result">...</div>
<div id="error">...</div>

<!-- But popup.js also references these that we can't find -->
<div id="full-report">...</div>
<button id="btn-detail">Show Charts</button>
<div id="metrics-chart">...</div>
<div id="trust-score">...</div>
<div id="m-credibility">...</div>
<div id="m-sentiment">...</div>
<div id="m-manipulation">...</div>
<div id="m-risk">...</div>
<div id="verdict-badge">...</div>
```

**Effect:** Result display fails; UI elements show but metrics don't populate

---

## 3. BROWSER COMPATIBILITY ANALYSIS

### Firefox Support Requirements

#### ❌ Current Implementation Issues:
1. **Manifest Version:** Chrome uses `manifest_version: 3`, Firefox *requires* MV3 (as of Firefox 109)
2. **Background Worker:** Chrome works with `service_worker`, Firefox uses different model
3. **Permissions:** Some Chrome permissions don't exist in Firefox

#### 🔄 Required Changes:

**manifest.json - Firefox version:**
```json
{
  "manifest_version": 3,
  "name": "Codexia AI - Media Intelligence",
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
    // Remove "tabs" - Firefox calls it differently
  ],
  "host_permissions": ["<all_urls>"],
  
  // ✅ Firefox requires explicit content scripts permissions
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end",
      "all_frames": true
    }
  ],
  
  // Background script changes
  "background": {
    "scripts": ["background.js"],  // Firefox uses "scripts" not "service_worker"
    "type": "module"
  },
  
  // Firefox doesn't use "action", uses "browser_action"
  "browser_action": {
    "default_popup": "popup.html",
    "default_title": "Codexia AI Analysis"
  }
}
```

#### API Differences - Code Changes:
```javascript
// ❌ Chrome-only APIs used:
chrome.tabs.query({ active: true, currentWindow: true })

// ✅ Firefox-compatible (but requires abstraction layer):
// Create browser compatibility layer:
const browserAPI = {
  getTabs: () => browser.tabs.query({ active: true, currentWindow: true }),
  sendMessage: (tabId, msg) => browser.tabs.sendMessage(tabId, msg)
}

// Then use:
// Instead of: chrome.tabs.query
// Use: browserAPI.getTabs()
```

#### Firefox-Specific Changes Needed:
1. Replace `chrome.*` with `browser.*` (or use conditional)
2. Update background script setup (no service workers)
3. Change `chrome.runtime.lastError` handling
4. Update storage API calls (Chrome `storage.local` works, but Firefox naming differs)

---

### Safari Support Requirements

#### ❌ Issues:
1. **Safari Web Extensions** use different manifest format entirely
2. **No Web Extensions API support** in older Safari (must use WebKit API)
3. **Sandboxing Model:** Safari has stricter permissions

#### Required Format Change:
```
manifest.json → Info.plist + manifest.json (Safari requires both)

Create Info.plist:
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC ...>
<plist version="1.0">
<dict>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.Safari.content</string>
  <key>NSExtensionAttributes</key>
  <dict>
    <key>SFSafariContentScript</key>
    <array>
      <dict>
        <key>Script</key>
        <string>content.js</string>
      </dict>
    </array>
  </dict>
</dict>
</plist>
```

#### Safari API Differences:
```javascript
// ❌ Chrome/Firefox:
chrome.tabs.query(...)
chrome.runtime.sendMessage(...)

// ✅ Safari (WebKit):
safari.self.tab
safari.extension.dispatchMessage('message', {...})
safari.extension.addContentScriptFromURL(script, patterns, includeSubFrames, runAtStart)
```

**Major Limitation:** Safari does NOT support `chrome.*` API at all - requires completely different implementation

---

### Edge & Brave Support Requirements

**Good News:** Edge and Brave use Chrome's Chromium engine and support the same Web Extensions API

#### ✅ Works with minimal changes:
- manifest.json works as-is
- background.js works as-is  
- content.js works as-is
- popup.js works as-is

#### ⚠️ Considerations:
1. **Icons:** Edge and Brave have different branding expectations
2. **Store:** Each has separate extension store (Edge Store, Brave extension marketplace)
3. **Permissions:** Some Edge-specific permissions exist

#### Changes needed:
```json
// Just add a fallback for Edge-specific properties:
{
  "manifest_version": 3,
  "name": "Codexia AI - Media Intelligence",
  
  // ✅ Edge-specific (optional):
  "default_locale": "en",
  "author": "TRUST SENSE",
  
  // All other properties work identically
}
```

---

## 4. MANIFEST FORMAT COMPARISON TABLE

| Feature | Chrome | Firefox | Safari | Edge | Brave |
|---------|--------|---------|--------|------|-------|
| manifest_version | 3 | 3 | Different | 3 | 3 |
| API Prefix | `chrome.*` | `browser.*` | `safari.*` | `chrome.*` | `chrome.*` |
| Background | `service_worker` | `scripts` | WebKit API | `service_worker` | `service_worker` |
| Content Scripts | Standard | Standard | Different | Standard | Standard |
| Permissions Format | JSON array | JSON array | Plist | JSON array | JSON array |
| Storage | `chrome.storage.*` | `browser.storage.*` | WebKit | `chrome.storage.*` | `chrome.storage.*` |
| Tabs API | ✅ Full | ✅ Full | ⚠️ Limited | ✅ Full | ✅ Full |

---

## 5. CROSS-BROWSER COMPATIBILITY STRATEGY

### Recommended Abstraction Layer

Create [chrome-extension/browser-api.js](browser-api.js):

```javascript
// ✅ Universal browser API abstraction
const browserAPI = (() => {
  const isChrome = typeof chrome !== 'undefined' && !typeof browser;
  const isFirefox = typeof browser !== 'undefined';
  const isSafari = typeof safari !== 'undefined';
  
  const api = isFirefox ? browser : (isChrome ? chrome : null);
  
  return {
    // Unified API
    tabs: {
      query: (options) => api.tabs.query(options),
      sendMessage: (tabId, msg) => api.tabs.sendMessage(tabId, msg)
    },
    runtime: {
      onInstalled: isChrome ? chrome.runtime.onInstalled : browser.runtime.onInstalled,
      onMessage: isChrome ? chrome.runtime.onMessage : browser.runtime.onMessage,
      lastError: isChrome ? chrome.runtime.lastError : browser.runtime.lastError
    },
    storage: {
      local: {
        get: (keys) => api.storage.local.get(keys),
        set: (items) => api.storage.local.set(items)
      }
    }
  };
})();

// Usage in code:
// Instead of: chrome.tabs.query()
// Use: browserAPI.tabs.query()
```

### Implementation Steps

1. **Create abstraction layer** (browser-api.js)
2. **Update background.js** to use browserAPI
3. **Update content.js** to use browserAPI
4. **Update popup.js** to use browserAPI  
5. **Create Firefox-specific manifest.json** (rename current to manifest-chrome.json)
6. **For Safari,** create separate bundle with WebKit API

---

## SUMMARY: Why Apps Aren't Working

### Desktop App Won't Launch:
1. **Module import error** prevents database from loading
2. **Preload.js not found** prevents IPC bridge setup
3. **Undefined functions** cause runtime errors when UI loads
4. **Handler name mismatch** causes IPC calls to fail

### Chrome Extension Returns Fake Results:
1. **analyzeContent() is stubbed** - always returns hardcoded score of 75
2. **No backend API integration** - never sends data to server
3. **Message handlers incomplete** - can't receive results from analysis
4. **DOM mismatches** - popup tries to update elements that don't exist

### Cross-Browser Not Supported:
1. **Firefox:** Needs `browser.*` API wrapper + manifest updates
2. **Safari:** Requires completely different implementation (WebKit API)
3. **Edge/Brave:** Should work with minor icon/store updates

---

## RECOMMENDED FIXES (Priority Order)

### 🔴 IMMEDIATE (Today)
- [ ] Fix database.js export to CommonJS
- [ ] Fix preload.js path in main.js
- [ ] Fix IPC handler names
- [ ] Implement real analyzeContent() in popup.js with API calls

### 🟡 CRITICAL (This Week)
- [ ] Add FormData support for audio/video
- [ ] Implement all missing event handlers
- [ ] Define missing UI functions (minimizeApp, openSettings)
- [ ] Fix popup.js DOM references

### 🟢 IMPORTANT (Next Week)
- [ ] Create browser API abstraction layer
- [ ] Build Firefox manifest variant
- [ ] Test on Edge and Brave
- [ ] Create Safari version

---

## TESTING STRATEGY

```bash
# Desktop App
npm start                     # Should launch window
# Check DevTools for errors

# Chrome Extension
chrome://extensions/          # Load unpacked
# Open any webpage, click extension icon
# Check popup should show real analysis score
# Check background/content script logs

# Cross-Browser
1. Update manifest per browser
2. Test message passing
3. Verify API calls working
4. Check storage access
```

Generated: March 30, 2026
