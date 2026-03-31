# Extension Setup Guide

## Chrome Extension

### Installation
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select `chrome-extension/` folder from this project
5. The extension should now appear in your Chrome toolbar

### Testing
1. Open any website
2. Click the Codexia extension icon (🔍)
3. Wait for analysis to complete
4. You should see:
   - Trust Score (0-100%)
   - Credibility score
   - Sentiment analysis
   - Manipulation score
   - Risk level (LOW, MEDIUM, HIGH)

### API Connection
- Requires backend running at `http://localhost:8000`
- Calls `/api/analyze-text` endpoint
- Real analysis from your backend (NOT hardcoded values)

---

## Firefox Extension

### Installation
1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate to `firefox-extension/manifest.json`
4. Select and load
5. The extension should now appear in Firefox

### Features
- Same functionality as Chrome version
- Uses Firefox Manifest V2 (compatible with older Firefox versions)
- Browser API (browser.* instead of chrome.*)
- Real-time analysis from backend API

### Testing
Same as Chrome - click icon, wait for analysis

---

## Safari Extension (Coming Soon)

Safari requires a different approach using Safari App Extensions.
Estimated implementation time: 2-3 hours for full compatibility.

### What's Different
- Native Swift/Objective-C components required
- Different packaging format (.safariextz)
- App wrapper required
- WebKit JavaScript API different from Chrome/Firefox

---

## Edge Extension (Compatible)

Edge uses Chromium engine, so Chrome extension works with minimal changes:

1. Open Edge and go to `edge://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `chrome-extension/` folder
5. Should work identically to Chrome

---

## Troubleshooting

### Extension Not Analyzing
- ✅ Verify backend is running: `http://localhost:8000/docs`
- ✅ Check extension console (press F12, switch to Extension tab)
- ✅ Verify page content is being extracted
- ✅ Check CORS headers from backend

### "API error: 401 Unauthorized"
- Backend authentication required
- Login at full web app first
- Or disable auth temporarily for testing

### Content Extraction Failed
- Some pages block content access (iframes, shadow DOM)
- Try on regular HTML pages first
- YouTube, Twitter, etc. may not work

### Cross-Origin (CORS) Errors
- Backend must allow requests from `chrome-extension://` and `moz-extension://`
- Update Flask CORS settings:
  ```python
  CORS(app, resources={r"/api/*": {"origins": ["*", "extension://*"]}})
  ```

---

## Real API Success
When working correctly, console should show:
```
📝 Calling backend API...
✅ Analysis received from API: {trust_score: 75, ...}
```

NOT:
```
Analysis received: {trust_score: 75} // Hardcoded stub
```

---

## Multi-Browser Build System (Optional)

To automate building for all browsers, create a build script that:
1. Copies source files to browser-specific folders
2. Transforms manifest.json for each browser
3. Replaces chrome.* → browser.* for Firefox
4. Handles Safari packaging separately

Commands:
```bash
npm run build:chrome   # Output: dist/chrome-extension/
npm run build:firefox  # Output: dist/firefox-extension/
npm run build:safari   # Output: dist/codexia.safariextz
npm run build:edge     # Output: dist/edge-extension/
```

This is a future enhancement - for now, manually test each extension.
