# 🚀 TRUST SENSE - Launch All Applications

## ✅ Currently Running

### Backend Stack (Docker)
```bash
✅ RUNNING - http://localhost:8000
- FastAPI Backend
- PostgreSQL Database (port 5432)
- Redis Cache (port 6379)
- React Frontend (port 5173)
```

**View API Docs**: http://localhost:8000/docs

---

## 🚀 Start Everything with One Command

### Option 1: Automated Launch Script (Windows)
```powershell
# Coming soon - will launch all apps automatically
```

### Option 2: Manual Launch (One Terminal Per App)

---

## 📱 Desktop App (Electron)

### Launch:
```bash
cd desktop-app
npm start
```

**What it does:**
- Analyze text content
- View analysis history
- Personal dashboard with metrics
- Settings configuration

**Features:**
- Offline mode with local SQLite storage
- Real-time analysis with backend
- Favorites and bookmarks
- Export analysis reports

---

## 📲 Mobile App (React Native)

### Android:
```bash
cd mobile-app
npx react-native run-android
```

### iOS:
```bash
cd mobile-app
npx react-native run-ios
```

**What it does:**
- Quick content analysis
- View recent analyses
- Mobile-optimized interface
- Push notifications

---

## 🌐 Chrome Extension

### Install:
1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `./chrome-extension` folder

**What it does:**
- Real-time page analysis
- One-click credibility check
- Verdict badge on websites
- Save analysis history

### Usage:
- Click extension icon on any webpage
- See instant trust score
- Get recommendations

---

## 📧 Email Plugin (Outlook)

### Install:
1. Open Outlook Web (outlook.office.com)
2. Go to Settings → Get Add-ins
3. Upload manifest: `./email-plugin/manifest.xml`
4. Or sideload directly

**What it does:**
- Analyze incoming emails
- Phishing detection
- Spam classification
- Email security warnings

### Usage:
- Open email
- Click "TRUST SENSE" in ribbon
- See security assessment

---

## 🧪 Testing All Endpoints

### Test Backend Directly:
```bash
# Text Analysis
curl -X POST http://localhost:8000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check this content",
    "content_type": "text"
  }'

# Desktop Platform
curl -X POST http://localhost:8000/api/platforms/desktop/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "Test",
    "content_type": "text"
  }'

# Mobile Quick Analyze
curl -X POST http://localhost:8000/api/platforms/mobile/quick-analyze \
  -d '{"content": "Test"}'

# Chrome Extension
curl -X POST http://localhost:8000/api/platforms/chrome/analyze-page \
  -H "X-API-Key: chrome-extension" \
  -d '{
    "page_url": "https://example.com",
    "page_content": "Page text here"
  }'

# Email Plugin
curl -X POST http://localhost:8000/api/platforms/email/analyze-message \
  -H "X-API-Key: outlook-plugin" \
  -d '{
    "email_subject": "URGENT: Verify Account",
    "email_body": "Click here immediately",
    "sender": "noreply@scam.com"
  }'

# Dashboard
curl -X GET "http://localhost:8000/api/dashboards/personal?period=30days" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Datasets
curl -X GET http://localhost:8000/api/datasets/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Dashboard Access

**Personal Dashboard**: http://localhost:8000/docs → `/api/dashboards/personal`

Via Desktop App:
- Open Desktop App
- Click "Dashboard" tab
- Select time period
- View analytics

---

## 🔌 API Integration Examples

### Python Example:
```python
import requests

API_URL = "http://localhost:8000"

# Analyze text
response = requests.post(f"{API_URL}/api/analyze-text", json={
    "content": "Your content here",
    "content_type": "text"
})
result = response.json()
print(f"Trust Score: {result['results']['trust_score']}")
print(f"Risk Level: {result['results']['risk_level']}")
```

### JavaScript Example:
```javascript
const API_URL = 'http://localhost:8000';

// Analyze content
const response = await fetch(`${API_URL}/api/analyze-text`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Your content',
    content_type: 'text'
  })
});

const result = await response.json();
console.log(result.results.trust_score);
```

---

## 📋 Full Application Stack

| App | Tech | Port | Status |
|-----|------|------|--------|
| Backend API | FastAPI | 8000 | ✅ Running |
| Frontend | React | 5173 | ✅ Running |
| Database | PostgreSQL | 5432 | ✅ Running |
| Cache | Redis | 6379 | ✅ Running |
| Desktop | Electron | — | 🔄 Start with npm start |
| Mobile | React Native | — | 🔄 Start with npm run android/ios |
| Chrome Ext | Extension | — | 🔄 Manual install |
| Email Plugin | Outlook Add-in | — | 🔄 Manual install |

---

## 🐛 Troubleshooting

### Desktop App not starting?
```bash
cd desktop-app
rm -r node_modules
npm install
npm start
```

### Mobile app issues?
```bash
cd mobile-app
npx react-native start
# In another terminal:
npx react-native run-android
```

### Chrome Extension not loading?
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Make sure `manifest.json` is in the folder

### Email Plugin not showing?
1. Hard refresh Outlook: Ctrl+Shift+Delete
2. Check manifest.xml is properly formatted
3. Ensure Office.js is loading

### API not responding?
```bash
# Check containers
docker-compose ps

# View logs
docker-compose logs backend

# Restart
docker-compose restart
```

---

## 📞 All Running

```
🎉 COMPLETE TRUST SENSE PLATFORM

✅ Backend API ........... http://localhost:8000/docs
✅ Frontend App .......... http://localhost:5173
✅ PostgreSQL DB ........ localhost:5432
✅ Redis Cache .......... localhost:6379

🚀 Launch:
├── Desktop App: cd desktop-app && npm start
├── Mobile App: cd mobile-app && npm run android
├── Chrome Extension: Load from chrome-extension/
└── Email Plugin: Sideload from email-plugin/manifest.xml
```

---

**Everything is ready to go!** 🚀

Next step: Pick an app and start analyzing content!
