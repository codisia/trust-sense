# 🚀 Complete Testing & Deployment Guide

## ✅ WHAT'S BEEN FIXED

### Desktop App
- ✅ **Fixed database initialization** - Now deferred until Electron app is ready
- ✅ **Fixed API client** - Single axios instance with proper interceptors
- ✅ **Fixed preload path** - Correct path.join() with __dirname
- ✅ **Fixed IPC handlers** - All 18 handlers implemented with error handling
- ✅ **Fixed module load issue** - Removed FormData (Node.js incompatible)
- ✅ **Fixed syntax errors** - Removed duplicate declarations
- ✅ Ready to launch with: `npm start`

### Chrome Extension
- ✅ **Replaced hardcoded analysis** - Now calls real backend API
- ✅ **Real API integration** - /api/analyze-text endpoint with actual scores
- ✅ **Proper error handling** - Shows errors if API fails
- ✅ **Ready to test** - Load in Chrome at chrome://extensions

### Firefox Extension (NEW)
- ✅ **Created full Firefox support** - Manifest V2 compatible
- ✅ **Real API integration** - Same backend calls as Chrome
- ✅ **Browser API abstraction** - Uses `browser.*` compatible APIs
- ✅ **Ready to test** - Load in Firefox at about:debugging

---

## 🧪 TESTING CHECKLIST

### Before Testing
```bash
# 1. Backend must be running
cd backend
python -m uvicorn app.main:app --reload

# 2. Frontend should optionally be running (for full web app)
cd frontend
npm run dev

# 3. Navigate to correct directory for desktop app
cd desktop-app
```

### Test 1: Desktop App Launch
```bash
cd desktop-app
npm start
```

**Expected Result:**
- ✅ Electron window opens (1400x900px, dark theme with cyan accents)
- ✅ Browser dev tools visible (F12 for debugging)
- ✅ Console shows: "✅ Electron app started", "✅ SQLite database connected"
- ✅ Can click buttons: Analyze, History, Dashboard, Settings, Logout

**If it fails:**
- Check console (F12) for errors
- Verify backend is running at http://localhost:8000
- Check that all node_modules are installed: `npm install`

---

### Test 2: Desktop App Analysis (Text)
1. Open desktop app: `npm start`
2. Click **"Analyze"** tab
3. Enter sample text: "This is a great product, best in the market!"
4. Click **"Analyze Content"**

**Expected Result:**
- ✅ Loading spinner appears (1-3 seconds)
- ✅ Trust Score displays (0-100%)
- ✅ Shows: Credibility, Sentiment, Manipulation, Risk Level
- ✅ Score saved to SQLite database instantly
- ✅ Result: Should show as text analysis in history

**Data flows:** Text → Main Process → Backend API → Analysis Data → Save to DB

---

### Test 3: Desktop App History
1. From desktop app, click **"History"** tab
2. You should see previous analyses

**Expected Result:**
- ✅ Table shows: Content (truncated), Score, Risk Level, Date
- ✅ Can filter by date range
- ✅ Can export to CSV
- ✅ Can delete individual records
- ✅ Can clear all history

---

### Test 4: Desktop App Settings
1. Click **"Settings"** tab
2. Toggle dark mode / change theme colors
3. See settings persist across restarts

**Expected Result:**
- ✅ Settings saved to SQLite
- ✅ Theme persists on restart (`npm start` again)
- ✅ Token stored (after login)

---

### Test 5: Chrome Extension
1. Open Chrome
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select `chrome-extension/` folder from this project
6. Extension icon appears in toolbar

**Testing the extension:**
1. Click icon on any website
2. Wait for analysis (should take 1-3 seconds)
3. Should show real analysis scores from backend

**Expected Result:**
- ✅ Trust Score: Actual value from /api/analyze-text (NOT 75%)
- ✅ Console shows: "📝 Calling backend API...", "✅ Analysis received from API"
- ✅ Scores change based on page content
- ✅ Can retry if API fails
- ✅ Can open full report in web app

**If stuck on 75%  or error:**
- Check browser console (F12, Console tab)
- Verify backend: http://localhost:8000/docs
- Clear extension storage: Right-click extension → Options

---

### Test 6: Firefox Extension  
1. Open Firefox
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select `firefox-extension/manifest.json`
5. Extension appears

**Testing:**
- Same as Chrome - click icon on any page
- Should show real analysis from backend
- Uses `browser.*` APIs instead of `chrome.*`

---

### Test 7: Cross-Browser Extension Features
Test these features in both Chrome and Firefox:

**Show full report button:**
- Click "Open Full Report"
- Should open http://localhost:5173 with analysis pre-filled

**Analyze content button:**
- Should call backend API
- Should display actual scores (not hardcoded)

**Error handling:**
- Turn off backend: `pkill python` or stop uvicorn
- Click extension again
- Should show "Analysis failed: Connection refused"
- Can click Retry to try again

---

## 📊 WHAT EACH COMPONENT DOES

```
┌─────────────────────────────────────────────────────────┐
│ User's Browser (Chrome / Firefox)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Extension Content Script (content.js)            │   │
│  │ - Extracts page text, title, meta description   │   │
│  │ - Sends via message to popup                     │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Extension Popup (popup.js / popup.html)          │   │
│  │ - Receives content from content script           │   │
│  │ - Calls /api/analyze-text with content           │   │  
│  │ - Displays results                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│ Desktop App (Electron)                                  │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│ │ main.js      │  │ preload.js   │  │ renderer.js  │  │
│ │ (main proc)  │  │ (IPC bridge) │  │ (UI logic)   │  │
│ │              │  │              │  │              │  │
│ │ IPC Handlers │←→│ IPC Routes   │←→│ Btn Clicks   │  │
│ │ API Calls    │  │              │  │ Forms        │  │
│ │ SQLite DB    │  │              │  │ Display      │  │
│ └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│ Backend API (http://localhost:8000)                     │
│ - POST /api/analyze-text                                │
│ - POST /api/analyze-url                                 │
│ - GET  /api/history                                     │
│ - POST /auth/login                                      │
│ - Returns: trust_score, credibility, risk_level, etc.   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 TROUBLESHOOTING

### Desktop App Won't Launch
**Problem:** Nothing happens when you run `npm start`

**Solution:**
1. Check Node.js version: `node --version` (should be 18+)
2. Check Electron installed: `npx electron --version`
3. Rebuild modules: `rm -rf node_modules && npm install`
4. Check for errors: Add `mainWindow.webContents.openDevTools()` to main.js (already there)
5. Check preload.js path is correct

---

### Extension Shows 75% Instead of Real Score
**Problem:** Extension always shows 75% trust score

**Solution:**
- ✅ This is now fixed! Extension calls real API
- If still showing hardcoded: Clear cache: Right-click icon → Options → Clear
- Reload extension: chrome/firefox extension page → click reload

---

### "Cannot find module 'sqlite3'"
**Solution:**
```bash
npm install sqlite3 --save
```

---

### Backend Returns 401 Unauthorized
**Problem:** Extension shows "API error: 401"

**Solution:**
- Login in web app first (to get auth token)
- Or: Temporarily disable auth for testing:
  ```python
  # In backend/app/main.py, comment out @require_auth decorator
  ```

---

### Content Extraction Failed in Extension
**Problem:** Extension can't get page content

**Solution:**
- Not all websites allow content extraction (e.g., YouTube)
- Try on regular HTML pages first
- Some sites use iframes or shadow DOM - these won't work

---

## 🚀 PRODUCTION DEPLOYMENT

### Building Desktop App
```bash
cd desktop-app
npm run build  # Creates executable for Windows/Mac/Linux
```

**Outputs:**
- `dist/` folder with installers
- Windows: `.exe` installer
- Mac: `.dmg` image  
- Linux: `.AppImage`

### Chrome Extension Publication
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create new item
3. Upload `chrome-extension/` folder as ZIP
4. Set title, description, icons
5. Publish

### Firefox Extension Publication
1. Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/)
2. Upload as ZIP (`firefox-extension/` folder)
3. Wait for review (usually 3-5 days)
4. Listed in Firefox Add-ons

### Safari Extension (Future)
- Requires Swift development
- Must be signed with Apple Developer account
- Different packaging format (.safariextz)
- Estimated implementation: 2-3 hours

---

## ✨ FEATURES IMPLEMENTED

| Feature | Desktop | Chrome | Firefox | Edge | Safari |
|---------|---------|--------|---------|------|--------|
| Text Analysis | ✅ | ✅ | ✅ | ✅* | 🔄 |
| URL Analysis | ✅ | ⏳ | ⏳ | ⏳* | 🔄 |
| History Tracking | ✅ | ⏳ | ⏳ | ⏳* | 🔄 |
| Real API Calls | ✅ | ✅ | ✅ | ✅* | 🔄 |
| Offline Support | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dark Mode | ✅ | ✅ | ✅ | ✅* | 🔄 |
| Export CSV | ✅ | ⏳ | ⏳ | ⏳* | 🔄 |

Legend: ✅ Done · ⏳ In Progress · 🔄 Planned · ❌ N/A · *Uses Chrome code

---

## 📝 NEXT STEPS

1. **Test desktop app:** `cd desktop-app && npm start`
2. **Test Chrome extension:** Load in Chrome
3. **Test Firefox extension:** Load in Firefox
4. **Report any bugs** with console errors
5. **Deploy:** Use build commands above for production

All functionality uses real backend API - no more hardcoded values!

