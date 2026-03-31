# Power BI Desktop: How to Expand Nested Data

## The Problem You're Seeing

When you load `http://localhost:8000/api/powerbi/data` into Power BI Desktop, you see:

```
┌─────────┬──────────────┬──────┐
│ status  │ total_records│ data │
├─────────┼──────────────┼──────┤
│success  │ 42           │ [List]
└─────────┴──────────────┴──────┘
```

The **data column contains nested records** that Are not automatically expanded.

---

## Solution: How to Expand the Data

### Step 1: Look for the Expand Icon

In Power BI, when you have nested data, look for the **double arrow button** (⬌) in the column header:

```
Click here: ⬌
       ↓
┌──────────────────────────────────────────┐
│ data        ⬌  (Expand)                  │
├──────────────────────────────────────────┤
│ List        (represents nested array)    │
└──────────────────────────────────────────┘
```

### Step 2: Click the Expand Icon

When you click ⬌, you'll see a popup:

```
┌─────────────────────────────────────┐
│ ☑ id                                │
│ ☑ content                           │
│ ☑ trust_score                       │
│ ☑ credibility_score                 │
│ ☑ sentiment_score                   │
│ ☑ sentiment_label                   │
│ ☑ dominant_emotion                  │
│ ☑ risk_level                        │
│ ☑ source_platform                   │
│ ☑ analysis_type                     │
│ ☑ created_at                        │
│ ☑ updated_at                        │
│                                     │
│ [Cancel]  [Use original column name]│
└─────────────────────────────────────┘
```

### Step 3: Select Fields & Load

1. **Keep all checked** (or uncheck ones you don't need)
2. **Click "Use original column name"** to append fields
3. **Power BI loads** - Now you see individual fields!

---

## Result After Expansion

After expanding, your table will look like:

```
┌──────┬──────────────┬──────────┬────────────┬──────────────┬──────────────┐
│ id   │ content      │ trust... │ sentiment..│ dominant_e...│ risk_level   │
├──────┼──────────────┼──────────┼────────────┼──────────────┼──────────────┤
│ uuid1│ "Text about "│ 85.5     │ positive   │ joy          │ LOW          │
│ uuid2│ "Another... "│ 65.2     │ neutral    │ neutral      │ MEDIUM       │
│ uuid3│ "Breaking... "│ 42.1     │ negative   │ fear         │ HIGH         │
│ ...  │ ...          │ ...      │ ...        │ ...          │ ...          │
└──────┴──────────────┴──────────┴────────────┴──────────────┴──────────────┘
```

---

## Creating Visualizations After Expansion

Once you have expanded data, use:

### Power BI Cards (KPI Cards)
**Use `/api/powerbi/summary` endpoint:**
- Single Value Cards for:
  - Total Analyses (total_analyses)
  - Avg Trust Score (avg_trust_score)
  - High Risk Count (high_risk_count)

### Bar Charts
- X-axis: `risk_level` (LOW, MEDIUM, HIGH, CRITICAL)
- Y-axis: Count of records
- Color: risk_level

OR

- X-axis: `source_platform` (twitter, instagram, etc)
- Y-axis: Count of records

### Pie/Donut Charts
- Values: `dominant_emotion` field
- Add count aggregation
- Shows emotion distribution

### Scatter Plot
- X-axis: `trust_score`
- Y-axis: `credibility_score`
- Color: `risk_level`
- Bubble size: `sentiment_score`

### Table Report
- Show all fields after expansion
- Add filters for risk_level, date range, platform
- Sort by created_at descending

---

## Pro Tips

### Tip 1: Refresh Strategy
- **Frontend Dashboard** (`/dashboard/powerbi`): Auto-refreshes every 5 minutes
- **Power BI Desktop:** Configure refresh schedule:
  - Home → Get Data → Data source settings
  - Refresh frequency (15 min minimum for free)

### Tip 2: Use Both Endpoints

**Endpoint 1: `/api/powerbi/summary` (For Quick KPIs)**
```json
{
  "total_analyses": 42,
  "avg_trust_score": 73.5,
  "high_risk_count": 5,
  "emotions": {"joy": 12, "fear": 8},
  "risk_distribution": {"LOW": 30, "MEDIUM": 8, "HIGH": 3, "CRITICAL": 1}
}
```
→ Use for **KPI cards and high-level dashboards**

**Endpoint 2: `/api/powerbi/data` (For Detailed Analysis)**
```json
{
  "status": "success",
  "total_records": 42,
  "data": [
    {"id": "...", "trust_score": 85.5, "risk_level": "LOW", ...},
    {...}
  ]
}
```
→ Use for **tables, detailed analysis, and drill-down**

### Tip 3: Combine with Google Trends
Create a separate page in Power BI that shows:
- Trending topics from `/api/trends` endpoint
- Their categories and trust scores
- Cross-reference with your analysis data

---

## Troubleshooting Expansion

### Problem: Expand Icon (⬌) Not Showing
**Solution:** Your data Source might not be properly formatted
- Verify backend returns valid JSON
- Test URL in browser: `http://localhost:8000/api/powerbi/data`
- Should see: `{"status":"success","total_records":0,"data":[]}`

### Problem: "List" Shows But Can't Expand
**Solution:** Data might be empty
- Create at least 1 analysis in the frontend dashboard first
- Then refresh Power BI
- Now the `data` array will have records

### Problem: Expanded Fields Not Showing Correct Data
**Solution:** Check column naming
- Look for columns with data type "Text", "Number", "Date"
- If showing `[Record]` that means nested object - expand again
- This shouldn't happen with our API, but possible with complex responses

---

## Recommended Dashboard Layout

### Page 1: Executive Summary
- 4 KPI cards (total, avg trust, high-risk, platforms) from `/api/powerbi/summary`
- Risk distribution pie chart
- Platform analysis bar chart
- Emotion breakdown bar chart

### Page 2: Detailed Analysis
- Table of all analysis records (expanded from `/api/powerbi/data`)
- Risk level slicer to filter
- Created date range filter
- Drill-down capability

### Page 3: Trends
- Top trends table from `/api/trends`
- Category distribution
- Trust score heatmap
- Trending vs analysis correlation

---

## Common Questions

### Q: Why do I see "List" instead of actual data?
**A:** The data column is nested. Click ⬌ expand icon to see individual records.

### Q: Can I automate the expansion?
**A:** Power BI expands automatically if you use the **Get Data > JSON** option instead of Web. But our API works perfectly with Web connector - just manually expand once.

### Q: How often does data refresh?
**A:** 
- **Frontend Dashboard**: Every 5 minutes auto
- **Power BI Desktop**: Whatever you configure (15 min minimum)
- **Backend API**: Real-time from PostgreSQL database

### Q: Can I use this with Power BI Service (cloud)?
**A:** Yes! But you'll need:
1. Deployed backend (not localhost)
2. HTTPS with valid certificate
3. Configure refresh schedule in Power BI Service
4. Recommended: Use service principal authentication

### Q: Is there a direct database connection option?
**A:** Not recommended (IPv6 issues on Windows). REST API is better:
- ✅ No IPv6 problems
- ✅ More secure
- ✅ Better for cloud deployments
- ✅ Aggregated data performance

---

## Video Guide Alternative

If you prefer visual walkthrough:
1. Open Power BI Desktop
2. Go to File → Options → (look for tutorials)
3. Or search YouTube: "Power BI expand nested JSON"
4. The exact same process applies to our API

---

**Version:** 1.0  
**Status:** ✅ Works with localhost and cloud backends
