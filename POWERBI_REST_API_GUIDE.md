# Power BI Connection Guide - REST API Approach ✅

## Why REST API Instead of Direct PostgreSQL?

**Direct PostgreSQL Connection (❌ IPv6 Issues):**
- Power BI tries to resolve `localhost:5432` → Returns IPv6 address
- Windows MobileRouter doesn't handle IPv6 well
- Error: "Le nom demandé est valide, mais aucune donnée du type requise n'a été trouvée"

**REST API Bridge (✅ No IPv6 Issues):**
- Power BI connects via HTTPS to your backend
- No IPv6 problems - standard HTTP protocol
- Faster, more secure, enterprise-ready
- Data is already aggregated and formatted for BI

---

## Quick Setup (2 Minutes)

### Step 1: Start Your Backend

Make sure Docker services are running:
```bash
docker-compose up -d
```

Or run backend directly:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### Step 2: Verify Endpoints Are Working

Test the endpoints in PowerShell:
```powershell
# Test Summary endpoint (aggregated metrics)
Invoke-WebRequest -Uri "http://localhost:8000/api/powerbi/summary" -UseBasicParsing | ConvertFrom-Json

# Test Data endpoint (raw records)
Invoke-WebRequest -Uri "http://localhost:8000/api/powerbi/data" -UseBasicParsing | ConvertFrom-Json
```

Both should return JSON without authentication errors.

---

## Power BI Desktop Connection (Step-by-Step)

### Option A: Using Web Connector (Recommended for Summary Data)

1. **Open Power BI Desktop**
2. Click **Home** → **Get Data** → **Web**
3. Paste one of these URLs:

   **For aggregated dashboard metrics:**
   ```
   http://localhost:8000/api/powerbi/summary
   ```

   **For raw analysis data:**
   ```
   http://localhost:8000/api/powerbi/data
   ```

4. Click **OK**
5. Power BI shows data preview → Click **Load**
6. Expand the JSON records:
   - For `/summary`: You'll see `total_analyses`, `avg_trust_score`, `high_risk_count`, `emotions`, `platforms`, `risk_distribution`
   - For `/data`: You'll see individual analysis records with `id`, `content`, `trust_score`, `risk_level`, etc.

---

### Option B: Create Custom Queries (Advanced)

If you want to combine both endpoints or add filters:

**Power Query M Code:**
```m
let
    SummaryUrl = "http://localhost:8000/api/powerbi/summary",
    SummaryData = Json.Document(Web.Contents(SummaryUrl)),
    DataUrl = "http://localhost:8000/api/powerbi/data",
    RawData = Json.Document(Web.Contents(DataUrl)),
    Records = RawData[data],
    Table = Table.FromList(Records, Splitter.SplitByNothing(), null, null, ExtraValues.Error)
in
    Table
```

1. Click **Home** → **Get Data** → **Blank Query**
2. Paste the code above
3. Click **Done**

---

## Quick Data Schema

### `/api/powerbi/summary` Returns:
```json
{
  "total_analyses": 42,
  "avg_trust_score": 73.5,
  "high_risk_count": 5,
  "emotions": {
    "joy": 12,
    "anger": 3,
    "fear": 8
  },
  "platforms": {
    "twitter": 25,
    "instagram": 17
  },
  "risk_distribution": {
    "LOW": 30,
    "MEDIUM": 8,
    "HIGH": 3,
    "CRITICAL": 1
  }
}
```

### `/api/powerbi/data` Returns:
```json
{
  "status": "success",
  "total_records": 42,
  "data": [
    {
      "id": "uuid-123",
      "content": "Text analyzed...",
      "trust_score": 85.5,
      "credibility_score": 92,
      "sentiment_score": 0.7,
      "sentiment_label": "positive",
      "dominant_emotion": "joy",
      "risk_level": "LOW",
      "source_platform": "twitter",
      "analysis_type": "general",
      "created_at": "2025-03-04T10:30:00"
    },
    ...
  ]
}
```

---

## Creating Visualizations in Power BI

### Dashboard 1: Executive Summary (from `/summary` endpoint)

**Cards:**
- Total Analyses: `[total_analyses]`
- Avg Trust Score: `[avg_trust_score]`
- High Risk Items: `[high_risk_count]`

**Pie Chart:**
- Risk Distribution by values
  
**Clustered Column:**
- Emotions by count
- Platforms by count

### Dashboard 2: Detailed Analysis (from `/data` endpoint)

**Table:**
- Columns: id, content, trust_score, risk_level, dominant_emotion, created_at

**Slicers:**
- Risk Level filter
- Platform filter
- Emotion filter

**Scatter Plot:**
- X-axis: trust_score
- Y-axis: credibility_score
- Color: risk_level
- Size: confidence

---

## Production Setup (Not Localhost)

For remote Power BI connections:

### 1. Update Backend Database URL
In `docker-compose.yml`:
```yaml
environment:
  DATABASE_URL: postgresql://trustsense:trustsense123@postgres:5432/trustsense
  CORS_ORIGINS: http://your-domain.com,https://app.powerbi.com
```

### 2. Deploy Backend to Cloud
Use Railway, Render, or Azure:
```bash
git push heroku main  # Or your cloud provider
```

### 3. Update Power BI URLs
Use your deployed backend URL:
```
https://your-api.herokuapp.com/api/powerbi/summary
https://your-api.herokuapp.com/api/powerbi/data
```

### 4. Configure Refresh Schedule
Power BI → Dataflows → Refresh settings:
- Set refresh frequency (e.g., every 15 minutes)
- Note: Free Power BI Refresh is limited; consider Pro license

---

## Troubleshooting

### ❌ "Connection Timeout"
→ Check if backend is running: `curl http://localhost:8000/api/powerbi/summary`

### ❌ "No Data Returned"
→ Database is empty. Create test data:
   1. Go to frontend dashboard
   2. Run analysis on sample text
   3. Refresh Power BI query

### ❌ "CORS Error"
→ Backend not allowing connections. Check `CORS_ORIGINS` in docker-compose.yml

### ❌ "SSL Certificate Error" (Production)
→ Add certificate or use `https://` with valid SSL. Power BI requires HTTPS for production.

---

## Summary

| Approach | Pros | Cons |
|----------|------|------|
| **Direct PostgreSQL** | Direct DB access | ❌ IPv6 issues on Windows |
| **REST API (Recommended)** | ✅ No IPv6 issues, Secure, Fast aggregation | Slightly higher latency |

**You're now using:** REST API Bridge (best practice!)

---

## Next Steps

1. ✅ Start backend
2. ✅ Test endpoints in PowerShell
3. ✅ Connect Power BI via Web connector
4. ✅ Create visualizations
5. ✅ Set refresh schedule

🎉 Done!
