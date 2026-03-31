# Power BI Quick Connect

## Your Current Setup
- **Backend API:** http://localhost:8000
- **Frontend:** http://localhost:5173
- **Database:** Supabase (PostgreSQL in cloud)
- **Docker Status:** ✅ Running

---

## ⚡ Quick Start (5 Minutes)

### Option A: Connect to Supabase Database

**In Power BI Desktop:**
1. `Home` → `Get Data` → `PostgreSQL`
2. Fill in:
   ```
   Server: db.detawdfanzmrkqbcfmus.supabase.co
   Database: postgres
   Port: 5432
   ```
3. Credentials (when prompted):
   ```
   Username: postgres
   Password: [Get from Supabase dashboard]
   ```
4. Click `Connect`
5. Select tables: `analysis`, `user`, `organization`

**Available columns for dashboards:**
- `trust_score` (0-100)
- `risk_level` (HIGH/MEDIUM/LOW)
- `dominant_emotion` (emotion types)
- `sentiment_score` (-1 to 1)
- `source_platform` (twitter, instagram, youtube, tiktok)
- `created_at` (timestamps for trends)

---

### Option B: Connect to REST API (Real-time)

**Step 1: Get JWT Token**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com", "password":"your_password"}'

# Copy the "access_token" value
```

**Step 2: In Power BI Desktop**
1. `Home` → `Get Data` → `Web`
2. URL: `http://localhost:8000/social-media/powerbi/dashboard-data`
3. When prompted, select `Custom`
4. Add Header:
   - Name: `Authorization`
   - Value: `Bearer YOUR_ACCESS_TOKEN_HERE`
5. Click `Load`

**Returns ready-to-use data:**
```json
{
  "summary": {
    "total_posts_analyzed": 42,
    "avg_trust_score": 78.5
  },
  "by_platform": {...},
  "by_risk_level": {...},
  "sentiment_distribution": {...},
  "trend_data": [...]
}
```

---

## 📊 Recommended Visualizations

| Chart Type | Field | Description |
|-----------|-------|-------------|
| Line Chart | trust_score by date | Trust score trend |
| Pie Chart | risk_level | Risk distribution |
| Bar Chart | dominant_emotion | Emotion breakdown |
| Stacked Bar | source_platform | Platform comparison |
| KPI Card | avg_trust_score | Key metric |
| Table | analysis | Raw data view |

---

## 🔑 Credentials Cheat Sheet

```
SUPABASE DATABASE
├─ Host: db.detawdfanzmrkqbcfmus.supabase.co
├─ Port: 5432
├─ Database: postgres
├─ Username: postgres
└─ Password: [From Supabase Dashboard]

REST API
├─ Base URL: http://localhost:8000
├─ Auth: Bearer {JWT_TOKEN}
├─ Endpoint: /social-media/powerbi/dashboard-data
└─ Endpoint: /social-media/powerbi/sync (POST)
```

---

## ✔️ Verify Setup Works

**Test 1: Check Backend API**
```bash
# Should return 200
curl http://localhost:8000/docs
```

**Test 2: Get sample data**
```bash
# Replace TOKEN with your JWT
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/social-media/powerbi/dashboard-data
```

**Test 3: Test Supabase connection**
```bash
# From command line (psql installed)
psql -h db.detawdfanzmrkqbcfmus.supabase.co \
     -U postgres \
     -d postgres \
     -c "SELECT COUNT(*) FROM analysis;"
```

---

## 🚀 Deploy to Production

When ready for production Power BI dashboards:

1. Change API URL from `localhost:8000` to your production backend
2. Use Supabase production password (not your dev one)
3. Set Power BI refresh schedule to 1 hour
4. Enable Azure authentication in Power BI Service
5. Share dashboards with stakeholders

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to Supabase" | Check password, verify IP whitelist in Supabase |
| "401 Unauthorized" | Get new JWT token, check Bearer format |
| "No tables visible" | Verify database permissions, check RLS policies |
| "Data not refreshing" | Set refresh schedule in Power BI, check endpoint |

---

## 📚 Full Documentation

See `POWERBI_CONNECTION_GUIDE.md` for detailed setup instructions.

---

**Last Updated:** March 3, 2026  
**Status:** ✅ Ready for Power BI connection
