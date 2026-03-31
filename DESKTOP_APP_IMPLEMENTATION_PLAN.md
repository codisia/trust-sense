# Desktop App Implementation Quick Reference

## Current State: 12% Complete

**Working:** Text analysis API calls, basic UI framework  
**Broken:** Everything else (history, dashboard, settings, audio, video, persistence)

---

## Phase 1: CRITICAL - Database & State (Days 1-3)

### 1. Add SQLite Database Layer
```bash
npm install better-sqlite3 knex
```

**Create:** `src/utils/database.js`
- Schema for: Analyses, Users, Settings, Queue
- Methods: create, read, update, delete
- Auto-sync with backend when online

### 2. Add State Management
```bash
npm install zustand @tanstack/react-query
```

**Create:** `src/stores/analysisStore.js`
- Store: analyses[], currentAnalysis, filters
- Actions: createAnalysis, deleteAnalysis, syncWithBackend
- Subscriptions: persist to SQLite

**Create:** `src/stores/authStore.js`
- Store: user, token, isAuthenticated
- Use: keytar for secure token storage (npm install keytar)

### 3. Add Token Management
```javascript
// src/utils/auth.js
import keytar from 'keytar'

export async function saveToken(token) {
  await keytar.setPassword('trust-sense', 'api_token', token)
}

export async function getToken() {
  return await keytar.getPassword('trust-sense', 'api_token')
}
```

---

## Phase 2: PAGE IMPLEMENTATION (Days 4-7)

### Analyze Page (✅ Already ~70%, needs refinement)
**TODO:**
- [ ] Remove mock data fallback
- [ ] Add real error handling
- [ ] Add loading spinner
- [ ] Fix URL validation
- [ ] Save to local DB on submit
- [ ] Show analysis to user

**Code Changes:**
```javascript
// In renderer.js, analyzeContent()
const result = await window.electronAPI.analyzeText(text)
// Store in Zustand store
useAnalysisStore.setState(state => ({
  analyses: [...state.analyses, result]
}))
// Also save to SQLite
await db.analyses.insert(result)
```

### History Page (❌ 20% UI only)
**PRIORITY: HIGH**
```javascript
// Create: src/pages/History.jsx (React component)
import { useAnalysisStore } from '../stores/analysisStore'

export function HistoryPage() {
  const { analyses, deleteAnalysis, filterBy } = useAnalysisStore()
  const [filtered, setFiltered] = useState(analyses)
  const [filters, setFilters] = useState({ riskLevel: '', minScore: '' })

  // Fetch from backend on mount
  useEffect(() => {
    fetchHistoryFromBackend()
  }, [])

  const handleDelete = (id) => {
    deleteAnalysis(id)
    // Also delete from backend
    API.delete(`/api/analysis/${id}`)
  }

  return (
    <div>
      {/* Filters */}
      <FilterBar />
      {/* List */}
      <AnalysisList items={filtered} onDelete={handleDelete} />
    </div>
  )
}
```

### Dashboard Page (❌ 10% UI only)
**PRIORITY: HIGH**
```javascript
// Create: src/pages/Dashboard.jsx
export function DashboardPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const res = await API.get('/api/stats/summary')
      setStats(res.data)
    }
    load()
  }, [])

  return (
    <div>
      <StatCard label="Total" value={stats?.total} />
      <StatCard label="Avg Score" value={Math.round(stats?.avg_score)} />
      <StatCard label="High Risk" value={stats?.high_risk} />
      {/* Add Recharts: TrendChart, DistributionChart */}
    </div>
  )
}
```

### Settings Page (❌ 0% functional)
**PRIORITY: MEDIUM**
```javascript
// Create: src/pages/Settings.jsx
export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore()

  const handleThemeChange = (theme) => {
    updateSettings({ theme })
    // Apply CSS class
    document.body.classList.toggle('dark-mode', theme === 'dark')
  }

  const handleLanguageChange = (lang) => {
    updateSettings({ language: lang })
    // Reload translations
    location.reload()
  }

  return (
    <form>
      <label>Theme: <select onChange={e => handleThemeChange(e.target.value)} /></label>
      <label>Language: <select onChange={e => handleLanguageChange(e.target.value)} /></label>
      <label>API URL: <input type="text" /></label>
      <button onClick={saveSettings}>Save</button>
    </form>
  )
}
```

---

## Phase 3: MEDIA SUPPORT (Days 8-10)

### Audio Upload
```javascript
// In src/pages/Analyze.jsx, add file input
<input type="file" accept="audio/*" onChange={handleAudioUpload} />

async function handleAudioUpload(file) {
  const formData = new FormData()
  formData.append('file', file)
  const result = await API.post('/api/analyze-audio', formData)
  // Display result
  showResult(result.data)
}
```

### Video Upload
```javascript
// Similar to audio
<input type="file" accept="video/*" onChange={handleVideoUpload} />

async function handleVideoUpload(file) {
  setLoading(true)
  try {
    const result = await API.post('/api/analyze-video', file, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    showResult(result.data)
  } finally {
    setLoading(false)
  }
}
```

---

## Phase 4: EXPORT & ADVANCED (Days 11-12)

### CSV Export
```javascript
// In src/utils/export.js
export async function exportToCSV(analyses) {
  const csv = [
    ['ID', 'Date', 'Type', 'Score', 'Risk', 'Summary'].join(','),
    ...analyses.map(a =>
      [a.id, a.created_at, a.input_type, a.trust_score, a.risk_level, a.summary].join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trust-sense-export-${Date.now()}.csv`
  a.click()
}
```

### Advanced Filters
```javascript
// In src/components/FilterBar.jsx
export function FilterBar({ onFilter }) {
  return (
    <div className="filters">
      <select onChange={e => onFilter('riskLevel', e.target.value)}>
        <option>All Risks</option>
        <option>LOW</option>
        <option>MEDIUM</option>
        <option>HIGH</option>
      </select>
      <input
        type="range"
        min="0"
        max="100"
        onChange={e => onFilter('minScore', e.target.value)}
        placeholder="Min Score"
      />
      <input
        type="date"
        onChange={e => onFilter('fromDate', e.target.value)}
      />
    </div>
  )
}
```

---

## Critical Bug Fixes

### 1. API URL Hardcoded
**File:** `main.js` line 7
```javascript
// BEFORE
const API_URL = 'http://localhost:8001'

// AFTER
const API_URL = process.env.API_URL || 'http://localhost:8000'
```

### 2. No Error Recovery
**File:** `main.js` - Add retry logic
```javascript
async function apiCallWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}
```

### 3. No Authentication
**File:** `main.js` - Add token to requests
```javascript
const token = await getToken() // from keytar
const response = await axios.post(url, data, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## File Structure to Create

```
desktop-app/src/
├── pages/
│   ├── Analyze.jsx  (refactor from renderer.js)
│   ├── History.jsx  (implement)
│   ├── Dashboard.jsx (implement)
│   └── Settings.jsx (implement)
├── components/
│   ├── FilterBar.jsx
│   ├── StatCard.jsx
│   ├── AnalysisList.jsx
│   ├── TrendChart.jsx
│   └── Sidebar.jsx
├── stores/
│   ├── analysisStore.js (Zustand)
│   ├── authStore.js
│   └── settingsStore.js
├── utils/
│   ├── api.js (axios instance)
│   ├── database.js (SQLite)
│   ├── auth.js (token management)
│   ├── export.js (CSV/PDF)
│   └── validators.js
├── styles/
│   └── tailwind.css (already exists)
├── App.jsx (main)
└── index.html (already exists)
```

---

## Testing Checklist

- [ ] Text analysis stores to DB
- [ ] History loads from DB on app start
- [ ] Filters work on history
- [ ] Settings persist after restart
- [ ] Token refreshes automatically
- [ ] Offline queue works
- [ ] Audio upload shows progress
- [ ] Video upload shows progress
- [ ] Export creates valid CSV
- [ ] Error messages appear for failed requests

---

## Estimated Effort by Feature

| Feature | Hours | Priority |
|---------|-------|----------|
| Database + State | 12 | 🔴 CRITICAL |
| Analyze Page Fixes | 6 | 🔴 CRITICAL |
| History Page | 12 | 🔴 CRITICAL |
| Dashboard Page | 10 | 🔴 CRITICAL |
| Auth + Token Mgmt | 8 | 🟠 HIGH |
| Settings Page | 6 | 🟠 HIGH |
| Audio Upload | 10 | 🟠 HIGH |
| Video Upload | 10 | 🟠 HIGH |
| Export & Filters | 8 | 🟡 MEDIUM |
| Error Handling | 6 | 🟡 MEDIUM |
| Testing | 12 | 🟡 MEDIUM |
| **TOTAL** | **100 hours** | **2-3 weeks** |

---

## Quick Start Commands

```bash
# Install dependencies
npm install zustand @tanstack/react-query axios keytar better-sqlite3

# Add TypeScript (optional but recommended)
npm install -D typescript @types/node @types/electron

# Dev with hot reload
npm run dev

# Build for production
npm run dist
```

---

*Last Updated: March 30, 2026*
*Status: Phase 1 Analysis Complete - Ready for Implementation*