# Power BI Integration Guide

## Overview
Your Trust Sense project has **THREE** ways to connect to Power BI:

### Option 1: Local PostgreSQL (Recommended - This is what you need!)
### Option 2: Direct Supabase Connection (Cloud Database)
### Option 3: REST API Connection (Real-time Data)

---

## Option 1: Connect Power BI to Local PostgreSQL (RECOMMENDED ✓)

This is the **easiest and fastest way** to get Power BI connected!

### Step 1: Start PostgreSQL Container
Run this command in PowerShell in your project folder:

```powershell
.\setup_powerbi.ps1
```

Or manually:
```powershell
docker compose down -v
docker compose build --no-cache
docker compose up -d
Start-Sleep -Seconds 30
docker compose ps
```

### Step 2: Verify PostgreSQL is Running
```powershell
# Check if postgres container is healthy
docker compose ps

# You should see:
# trust-sense-postgres  "postgres:15-alpine"  Up (healthy)
# trust-sense-backend   Backend container     Up (healthy)
# trust-sense-frontend  Frontend container    Up (healthy)
# trust-sense-redis     Redis container       Up (healthy)
```

### Step 3: Connect Power BI Desktop

**Open Power BI Desktop** and follow these steps:

1. **Home** → **Get Data** → **PostgreSQL**
   
2. **Enter Connection Details:**
   - **Server:** `localhost`
   - **Database:** `trustsense`
   - **Port:** (leave blank, defaults to 5432)
   - Click **OK**

3. **Choose Connection Mode:**
   - Select **Import** (for snapshot data every hour)
   - OR **DirectQuery** (for real-time data - requires Power BI Premium)
   - Click **OK**

4. **Enter Credentials:**
   - **Username:** `trustsense`
   - **Password:** `trustsense123`
   - Click **Connect**

5. **Select Tables:**
   - ✓ `user` - All users with roles and organizations
   - ✓ `analysis` - All sentiment/trust analysis results
   - ✓ `organization` - Organization information
   - ✓ `organization_member` - Team members
   - Click **Load**

6. **Create Visualizations!**
   
   After tables load, you can create dashboards using:
   - `analysis.trust_score` - Trust score 0-100
   - `analysis.sentiment_score` - Positive/negative sentiment
   - `analysis.dominant_emotion` - Detected emotion (joy, anger, fear, etc.)
   - `analysis.risk_level` - Risk assessment (LOW, MEDIUM, HIGH, CRITICAL)
   - `analysis.source_platform` - Social media platform (twitter, instagram, youtube, tiktok)
   - `analysis.created_at` - Timeline and trends

### Step 4: Sample Dashboard Queries

Once connected, try these Power BI queries:

**📊 Trust Score by Platform**
```
SELECT 
    source_platform,
    COUNT(*) as posts,
    ROUND(AVG(trust_score)::NUMERIC, 2) as avg_trust,
    ROUND(AVG(credibility_score)::NUMERIC, 2) as avg_credibility
FROM analysis
GROUP BY source_platform
ORDER BY avg_trust DESC;
```

**⚠️ High Risk Analysis**
```
SELECT 
    COUNT(*) as high_risk_count,
    source_platform,
    dominant_emotion,
    risk_level
FROM analysis
WHERE risk_level IN ('HIGH', 'CRITICAL')
GROUP BY source_platform, dominant_emotion, risk_level;
```

**📈 Trend Over Time**
```
SELECT 
    DATE(created_at) as date,
    AVG(trust_score) as avg_trust,
    COUNT(*) as analysis_count
FROM analysis
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

### Step 5: Schedule Automatic Refresh

In Power BI Service:
1. Upload your desktop file to Power BI Service
2. **Settings** → **Dataset Settings** → **Gateway Connection**
3. Set refresh frequency to **Daily** or **Hourly**
4. Power BI will automatically pull latest data from PostgreSQL

### ⚡ Quick Troubleshooting

**PostgreSQL won't connect?**
```powershell
# Test the connection
docker exec trust-sense-postgres psql -U trustsense -d trustsense -c "SELECT 1;"

# View logs
docker logs trust-sense-postgres

# Check if port 5432 is listening
netstat -ano | findstr :5432
```

**No tables showing in Power BI?**
```powershell
# List all tables in database
docker exec trust-sense-postgres psql -U trustsense -d trustsense -c "\dt"

# Count records in analysis table
docker exec trust-sense-postgres psql -U trustsense -d trustsense -c "SELECT COUNT(*) FROM analysis;"
```

**Wrong password error?**
- Username: `trustsense` (not postgres!)
- Password: `trustsense123`
- Database: `trustsense`

---

## Option 2: Connect Power BI to Supabase PostgreSQL (Cloud)

### Step 1: Get Your Supabase Credentials
```
URL: https://detawdfanzmrkqbcfmus.supabase.co
Database Host: db.detawdfanzmrkqbcfmus.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: [Your Supabase password from dashboard]
```

### Step 2: Enable Supabase Connections
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `detawdfanzmrkqbcfmus`
3. Go to **Project Settings** → **Database**
4. Note the connection string:
   ```
   postgresql://postgres:[password]@db.detawdfanzmrkqbcfmus.supabase.co:5432/postgres
   ```

### Step 3: Connect in Power BI Desktop
1. Open **Power BI Desktop**
2. Go to **Home** → **Get Data** → **PostgreSQL**
3. Enter connection details:
   - **Server:** `db.detawdfanzmrkqbcfmus.supabase.co`
   - **Database:** `postgres`
   - **Port:** `5432`
4. Click **Connect**
5. When prompted for credentials:
   - **Username:** `postgres`
   - **Password:** [Your database password]
   - **Encryption mode:** `None` (for development) or `SSL` (for production)
6. Click **Connect**

### Step 4: Select Tables to Load
After connecting, you'll see available tables:
- `user` - All users with roles
- `analysis` - All sentiment/trust analysis results
- `organization` - Multi-tenant org data
- `organization_member` - Org membership/roles

### Step 5: Create Power BI Reports
Available fields for dashboards:

**From `analysis` table:**
- `trust_score` (0-100)
- `risk_level` (HIGH, MEDIUM, LOW)
- `dominant_emotion` (joy, anger, fear, sadness, etc.)
- `sentiment_score` (positive/negative)
- `source_platform` (twitter, instagram, youtube, tiktok)
- `created_at` (timestamp for trends)

**Recommended Visualizations:**
- Trust Score Trend (Line chart by date)
- Risk Level Distribution (Pie/Donut)
- Emotion Breakdown (Bar chart)
- Platform Analysis (Stacked bar)
- User Activity (Table)

---

## Option 3: Connect via REST API (Best for Real-time Data)

### Available Power BI Endpoints

**Endpoint 1: Get Aggregated Dashboard Data**
```
GET http://localhost:8000/social-media/powerbi/dashboard-data
Authorization: Bearer <YOUR_TOKEN>

Response:
{
  "summary": {
    "total_posts_analyzed": 42,
    "avg_trust_score": 78.5,
    "high_risk_count": 3,
    "platforms_analyzed": ["twitter", "instagram", "youtube"]
  },
  "by_platform": {
    "twitter": { "count": 20, "avg_trust": 82.1 },
    "instagram": { "count": 15, "avg_trust": 75.3 }
  },
  "by_risk_level": {
    "HIGH": 3,
    "MEDIUM": 12,
    "LOW": 27
  },
  "sentiment_distribution": {
    "positive": 28,
    "neutral": 10,
    "negative": 4
  },
  "trend_data": [...]
}
```

**Endpoint 2: Sync to Power BI**
```
POST http://localhost:8000/social-media/powerbi/sync
Authorization: Bearer <YOUR_TOKEN>

Response:
{
  "status": "success",
  "message": "Data synced to Power BI",
  "records_synced": 42,
  "platforms": ["twitter", "instagram", "youtube"]
}
```

### Connect REST API to Power BI Desktop

1. Open **Power BI Desktop**
2. Go to **Home** → **Get Data** → **Web**
3. Paste URL:
   ```
   http://YOUR_BACKEND_URL/social-media/powerbi/dashboard-data
   ```
4. Click **OK**
5. When prompted for authentication:
   - Select **Custom**
   - Add header: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`
6. Load data and create visualizations

---

## Option 4: Local PostgreSQL Setup in Docker (Alternative)

If you want to manually add PostgreSQL to your docker-compose.yml instead of using the script:

### What's Already Done For You:

✓ PostgreSQL service is now **enabled** in `docker-compose.yml`
✓ Database initialization script created in `init-db.sql`
✓ All tables are auto-created with sample data
✓ Port 5432 is exposed for Power BI connections
✓ Persistent volume `postgres_data` stores your data

### Just Run This:

```powershell
# From your project root folder
cd c:\Users\hasse\Downloads\trust-sense-fixed\ts-fix
docker compose up -d postgres
docker compose up -d
Start-Sleep -Seconds 30
docker compose ps
```

Your PostgreSQL is now running at `localhost:5432` with:
- Database: `trustsense`
- User: `trustsense`
- Password: `trustsense123`

---

## Getting Your JWT Token for API Access

### Step 1: Login and Get Token
```bash
# Register/Login to get JWT token
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yourpowerbi@example.com",
    "password": "SecurePassword123!",
    "full_name": "Power BI User"
  }'

# Response will include token
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": "..."
}
```

### Step 2: Use Token in Power BI
Copy the `access_token` value and use it in Power BI's custom header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Recommended Architecture

### For Production:
1. ✅ Use **Option 1** (Supabase Direct Connection)
2. ✅ Create scheduled refresh (every 1 hour)
3. ✅ Use Power BI Premium for real-time dashboards
4. ✅ Enable Row-Level Security (RLS) in Power BI

### For Development:
1. ✅ Use **Option 2** (REST API)
2. ✅ Test with mock data
3. ✅ Switch to Option 1 for production

---

## Troubleshooting

### "Cannot connect to Supabase"
- Verify your IP is whitelisted in Supabase Network settings
- Check database password is correct
- Try with `sslmode=require` in connection string

### "401 Unauthorized on API call"
- Verify JWT token is not expired
- Check Authorization header format: `Bearer <TOKEN>`
- Get new token by logging in

### "No tables visible in Power BI"
- Ensure user has database access permissions
- Check Supabase RLS policies allow reads
- Try with postgres superuser account

### "Real-time data not updating"
- Configure Power BI refresh schedule
- Use Power BI Premium for DirectQuery mode
- Or schedule API sync endpoint to run periodically

---

## Next Steps

1. **Choose Connection Method:**
   - Database Direct (Supabase) → Best for static reports
   - REST API → Best for real-time, aggregated data

2. **Get Credentials:**
   - Supabase password from dashboard
   - JWT token from `/auth/register` endpoint

3. **Create First Dashboard:**
   - Connect to data source
   - Create Trust Score trend chart
   - Add Risk Level distribution
   - Publish to Power BI Service

4. **Schedule Refresh:**
   - Set automatic refresh every hour
   - Or trigger `/social-media/powerbi/sync` via scheduler

---

## Sample Power BI DAX Formulas

```dax
// Risk Score
RiskScore = IF(
  COUNTIF(Analysis[risk_level], "HIGH") > 5,
  "CRITICAL",
  "NORMAL"
)

// Avg Trust by Platform
AvgTrustByPlatform = AVERAGE(Analysis[trust_score])

// Sentiment Trend
SentimentTrend = 
CALCULATE(
  AVERAGE(Analysis[sentiment_score]),
  DATESBETWEEN(Analysis[created_at], TODAY()-30, TODAY())
)
```

---

## Support

For issues:
- Check backend logs: `docker compose logs backend`
- Test API: `http://localhost:8000/docs` (Swagger UI)
- Verify Supabase connection: Check database dashboard
