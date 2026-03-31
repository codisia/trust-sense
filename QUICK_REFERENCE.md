# ⚡ Quick Reference Card

## 🚀 START HERE

### 1. Desktop App (Electron)
```bash
cd desktop-app
npm install          # First time only
npm run css:build    # Build Tailwind (optional, npm start does this)
npm start            # Start the app ✨

# Expected: Dark window with cyan/purple theme opens with Analyze, History, Settings tabs
```

### 2. Chrome Extension
```
1. Open: chrome://extensions
2. Toggle: Developer mode (top right)
3. Click: Load unpacked
4. Select: chrome-extension/ folder
5. Done! Icon appears in toolbar
6. Click icon on any website to analyze
```

### 3. Firefox Extension
```
1. Open: about:debugging#/runtime/this-firefox
2. Click: Load Temporary Add-on
3. Select: firefox-extension/manifest.json
4. Done! Icon appears in toolbar
5. Click icon on any website to analyze
```

### 4. Backend (Required for all above)
```bash
cd backend
python -m uvicorn app.main:app --reload

# Expected: http://localhost:8000/docs (Swagger API docs open)
```

---

## ✅ WHAT WORKS NOW

| Feature | Desktop | Chrome | Firefox |
|---------|---------|--------|---------|
| Text Analysis | ✅ | ✅ | ✅ |
| Real API Calls | ✅ | ✅ | ✅ |
| History Storage | ✅ | ⏳ | ⏳ |
| CSV Export | ✅ | ⏳ | ⏳ |
| Dark Mode | ✅ | ✅ | ✅ |
| Offline Support | ✅ | ❌ | ❌ |

---

## 🔍 TESTING QUICK CHECKS

### Desktop App Ready?
```bash
npm start
# Should see: "✅ Electron app started" in console
# Should see: Electron window opens
```

### Extension Really Calling API?
Console should show:
```
📝 Calling backend API...
✅ Analysis received from API: {trust_score: 75, ...}
```

NOT:
```
Analysis received: {trust_score: 75}  // This means hardcoded!
```

---

## 🛠️ TROUBLESHOOTING

### Desktop app won't start
```bash
npm install              # Missing modules?
npm run css:build       # Failed to build CSS?
node --check main.js    # Syntax errors?
```

### Extension shows error
1. Check backend running: http://localhost:8000/docs
2. Check console: F12 → Console tab
3. Reload extension: Extensions page → click reload

### 75% score = outdated code
- Clear extension storage
- Reload extension
- Hard refresh browser (Ctrl+Shift+R)

---

## 📁 KEY FILES

```
desktop-app/main.js           ← Electron with SQLite + API
chrome-extension/popup.js     ← Real API calls (fixed!)
firefox-extension/popup.js    ← Firefox version (new!)
backend/app/main.py           ← Backend API
```

---

## 💡 QUICK COPY-PASTE COMMANDS

### Full Setup (Run in order)
```powershell
# Backend
cd backend && python -m uvicorn app.main:app --reload

# New terminal - Frontend (optional)
cd frontend && npm run dev

# New terminal - Desktop App  
cd desktop-app && npm install && npm start
```

### Just Desktop App
```powershell
cd desktop-app && npm start
```

### Check if it works
```powershell
# Can you see output?
cd desktop-app && node main.js 2>&1 | Select-Object -First 10

# Syntax valid?
node --check main.js
```

---

## 🎯 VERIFICATION CHECKLIST

- [ ] Backend running at http://localhost:8000
- [ ] Desktop app `npm start` works (window opens)
- [ ] Desktop app analyzes text (shows real score)
- [ ] Desktop app stores history (SQLite)
- [ ] Chrome extension loaded
- [ ] Chrome extension shows real score (not 75%)
- [ ] Firefox extension loaded
- [ ] Firefox extension works like Chrome

---

## ❌ COMMON MISTAKES

| Mistake | Fix |
|---------|-----|
| "npm start not found" | Make sure you're in `desktop-app/` folder |
| "api undefined" | Backend not running on port 8000 |
| "No module:" | Run `npm install` in that folder |
| "Can't load extension" | Make sure you're using correct folder |
| "Always shows 75%" | Clear extension cache, reload |
| "SQLite errors" | Delete `~/AppData/Local/trust-sense-desktop` and restart |

---

## 🔗 USEFUL LINKS

- Backend API Docs: http://localhost:8000/docs
- Electron Preload: desktop-app/src/preload.js
- Database: ~/AppData/Local/trust-sense-desktop/data/trustsense.db

---

## 📞 IF SOMETHING'S WRONG

**Show me:** Console output from F12 or terminal error
**Check:** Is backend running?
**Try:** npm install && npm start (full reinstall)

---

**Last Updated:** Fix Summary Complete ✅
**Status:** Desktop App + Extensions Ready for Testing
