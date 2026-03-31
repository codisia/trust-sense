# Chrome Extension Testing Guide

## ✅ Pre-Test Checklist

- [x] Backend running on `http://localhost:8000` ✅
- [x] Extension files created in `chrome-extension/` ✅
- [x] Chrome browser available ✅

**Status**: Ready to test!

---

## 📋 Step 1: Load Extension in Chrome

### 1.1 Open Chrome Extensions Page
1. Open **Google Chrome**
2. Go to: `chrome://extensions/`

### 1.2 Enable Developer Mode
- Toggle **Developer mode** ON (top-right corner)

### 1.3 Load Unpacked Extension
1. Click **"Load unpacked"**
2. Navigate to: `c:\Users\hasse\Downloads\trust-sense-fixed\ts-fix\chrome-extension\`
3. Click **Select Folder**

### Expected Result:
- Extension appears in the list
- Extension ID is assigned
- Icon appears in Chrome toolbar

---

## 🧪 Step 2: Basic Functionality Test

### Test 1: Extension Icon Click
1. **Click the TRUST SENSE extension icon** in the toolbar
2. **Popup should appear** with:
   - Title: "TRUST SENSE - Content Analysis"
   - Input field for URL/text
   - Loading spinner (initially hidden)
   - Results section (initially empty)

**Status**: ✅ Pass if popup appears

### Test 2: Analyze Text
1. Click in the **input field**
2. **Paste sample text**:
   ```
   Breaking news! Scientists discover cure for all diseases! 
   Click here now before the government removes this! 
   This is 100% true according to anonymous sources.
   ```
3. Click **"Analyze"** button
4. Wait for **loading spinner**
5. Results should show:
   - **Trust Score**: A percentage (0-100)
   - **Status**: Color-coded badge
   - **Metrics Table**: Details about analysis

**Status**: ✅ Pass if results appear within 5 seconds

### Expected Response Example:
```json
{
  "trust_score": 23,
  "content_quality": "Low",
  "manipulation_detected": true,
  "sentiment": "Negative",
  "credibility_indicators": ["Unverified claims", "Urgency tactics"],
  "recommendation": "Verify before sharing"
}
```

---

## 🌐 Step 3: Real Page Analysis

### Test 3: Analyze Current Page
1. Visit a test website: **Wikipedia** or **BBC News**
2. Click the **extension icon**
3. Click **"Analyze Current Page"** button
4. Should extract page content and analyze it

**Status**: ✅ Pass if page analysis works

### Test 4: Analyze with URL
1. In the extension popup, enter a URL:
   ```
   https://www.wikipedia.org/wiki/HTTPS
   ```
2. Click **"Analyze"**
3. Results should show analysis of that page

**Status**: ✅ Pass if URL analysis works

---

## 🔧 Step 4: API Integration Test

### Test 4.1: Check Backend Connection
Open **DevTools** for the extension:

1. Right-click extension icon → **"Inspect"**
2. Go to **Console** tab
3. Should see no errors about API connection
4. Look for successful API calls

### Test 4.2: Query Backend Directly
Open terminal and run:

```powershell
# Test 1: Basic health check
curl -X GET "http://localhost:8000/health" `
  -H "Content-Type: application/json"

# Test 2: Analyze text
curl -X POST "http://localhost:8000/api/analyze" `
  -H "Content-Type: application/json" `
  -d '{"text":"Sample content to analyze","source":"chrome-extension"}'

# Test 3: Get analysis results
curl -X GET "http://localhost:8000/api/analysis/history" `
  -H "Content-Type: application/json"
```

**Expected Output**:
```json
{
  "trust_score": 65,
  "content_quality": "Medium",
  "manipulation_detected": false,
  ...
}
```

---

## 📊 Step 5: Detailed Testing Scenarios

### Scenario 1: Credible Content
**Input**:
```
The International Space Station orbits Earth approximately every 90 minutes. 
According to NASA, it travels at about 17,500 mph. 
This information comes from official NASA sources.
```

**Expected**:
- High trust score (70+)
- Status: ✅ Credible
- Few manipulation indicators

### Scenario 2: Manipulative Content
**Input**:
```
YOU WON'T BELIEVE THIS! Scientists HATE this one trick! 
Click immediately or you'll regret it forever! 
Big pharma doesn't want you to know!!!
```

**Expected**:
- Low trust score (30-)
- Status: ⚠️ Potentially Misleading
- Multiple manipulation flags detected

### Scenario 3: Mixed Content
**Input**:
```
Studies show that exercise is beneficial for health. 
However, this one supplement can replace years of workouts! 
Doctors recommend 30 minutes daily but this product is faster.
```

**Expected**:
- Medium trust score (40-60)
- Status: ⚠️ Mixed Signals
- Some credibility with claims that contradict evidence

---

## 🐛 Step 6: Debugging & Troubleshooting

### If Popup Won't Load
1. **Check extension icon** in toolbar
2. **Right-click** → "Manage extension"
3. Verify **"Enabled"** is ON
4. Check **Errors** tab for issues

### If Analysis Returns No Results
1. **Open DevTools** (F12)
2. Go to **Console** tab
3. Look for network errors
4. Verify backend is running: `curl http://localhost:8000/health`
5. Check extension permission in **Details** tab

### If Backend Connection Fails
1. Verify backend is running:
   ```powershell
   docker-compose ps
   ```
2. Test directly:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8000/health"
   ```
3. Check backend logs:
   ```powershell
   docker-compose logs backend
   ```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Extension not appearing | Refresh `chrome://extensions/`, reload Chrome |
| Popup won't open | Check console for errors, verify manifest.json |
| No results after analysis | Restart backend: `docker-compose restart backend` |
| CORS errors | Backend already has CORS enabled |
| API returns 500 error | Check backend logs: `docker logs trust-sense-backend` |

---

## ✅ Test Completion Checklist

- [ ] Extension loads in Chrome ✅
- [ ] Popup opens when icon clicked ✅
- [ ] Text input works ✅
- [ ] Analysis buttons respond ✅
- [ ] Results display properly ✅
- [ ] API responses are correct ✅
- [ ] Content badge colors show correctly ✅
- [ ] No console errors ✅
- [ ] Multiple analyses work sequentially ✅
- [ ] Page analysis extracts content ✅

---

## 📈 Performance Metrics

Measure these during testing:

```
Analysis Speed Target: < 2 seconds
API Response Time: < 1 second
Memory Usage: < 50MB
Results Accuracy: >95% on test cases
```

---

## 🚀 Next Steps After Testing

1. ✅ Verify all tests pass
2. 📝 Document any issues found
3. 🔧 Fix any bugs in extension code
4. 🌐 Test on different websites
5. 📦 Prepare for Chrome Web Store submission (optional)

---

## 📧 Test Report Template

```
Test Date: ___________
Tester: ________________
Chrome Version: ________
Backend Status: ✅ Running

Test Results:
- Extension Load: ✅ PASS / ❌ FAIL
- Popup Display: ✅ PASS / ❌ FAIL
- Text Analysis: ✅ PASS / ❌ FAIL
- URL Analysis: ✅ PASS / ❌ FAIL
- API Connection: ✅ PASS / ❌ FAIL
- Results Display: ✅ PASS / ❌ FAIL

Issues Found:
1. ___________________
2. ___________________

Overall Status: ✅ WORKING / ⚠️ ISSUES / ❌ BROKEN
```

---

## 🎯 Success Criteria

**Extension is working correctly when:**

1. ✅ Loads in Chrome without errors
2. ✅ Popup displays all UI elements
3. ✅ Analyzes text and shows results
4. ✅ Connects to backend API
5. ✅ Returns proper analysis scores
6. ✅ Handles errors gracefully
7. ✅ Works on multiple webpages
8. ✅ Response time < 2 seconds

---

**Status**: 🟢 **READY FOR TESTING**

Start with Step 1: Load Extension in Chrome
