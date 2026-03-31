# TRUST SENSE - Developer Quick Reference

## 🚀 Start Here

### 30-Second Setup (Local Development)
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# API available at http://localhost:8000/docs
```

### 2-Minute Full Stack (with Docker)
```bash
docker-compose up -d
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
# Database: localhost:5432
```

---

## 📁 File Navigation

### Core AI Engine
- **Text Analysis**: `backend/app/ai_engine/text_analyzer.py`
  - 10+ metrics: sentiment, credibility, deception, manipulation, etc.
  - ~600 lines, ~50 signal indicators
  
- **Psychological Analysis**: `backend/app/ai_engine/psychological_analyzer.py`
  - Emotion detection (6 emotions)
  - Cognitive biases (5 types)
  - Manipulation patterns (6 types)
  - ~850 lines

- **Multimodal Orchestrator**: `backend/app/ai_engine/multimodal_analyzer.py`
  - Coordinates all analyzers
  - Aggregates results
  - Trust score calculation
  - ~450 lines

- **Audio/Video Framework**: `backend/app/ai_engine/audio_video_analyzers.py`
  - Audio: transcription, emotion, speaker ID
  - Video: deepfakes, faces, gestures, OCR
  - ~250 lines (framework, real integrations needed)

### API Endpoints
- **Core Analysis**: `backend/app/routers/analysis.py`
  - POST `/api/analyze-text`
  - POST `/api/analyze-audio`
  - POST `/api/analyze-video`
  - POST `/api/analyze-multimodal`

- **Multi-Platform**: `backend/app/routers/platforms.py` (NEW)
  - Desktop app (13 endpoints)
  - Mobile app (lightweight)
  - Chrome extension
  - Email plugin
  - Chatbots (FB/WhatsApp/Telegram)

- **Datasets**: `backend/app/routers/datasets.py` (NEW)
  - Upload annotated data: POST `/api/datasets/upload/{domain}`
  - List datasets: GET `/api/datasets/list`
  - Model training: POST `/api/datasets/{id}/retrain`
  - Sample access: GET `/api/datasets/{id}/samples`

- **Dashboards**: `backend/app/routers/dashboards.py` (NEW)
  - Personal dashboard: GET `/api/dashboards/personal`
  - Org dashboard: GET `/api/dashboards/organization`
  - Reports: GET `/api/dashboards/reports/pdf|csv`
  - Analytics: GET `/api/dashboards/analytics/trends|domains`

### Configuration
- **Environment**: `backend/.env` or `backend/.env.local`
- **Settings**: `backend/app/core/config.py`
- **Database**: `backend/app/core/database.py`
- **Auth**: `backend/app/core/security.py`
- **Supabase**: `backend/app/core/supabase_auth.py`

---

## 🔑 Key Classes & Functions

### TextAnalyzer
```python
from app.ai_engine.text_analyzer import TextAnalyzer

analyzer = TextAnalyzer()
result = await analyzer.analyze(content)
# Returns: {sentiment, credibility, fake_news_probability, manipulation_score, ...}
```

### PsychologicalAnalyzer
```python
from app.ai_engine.psychological_analyzer import PsychologicalAnalyzer

analyzer = PsychologicalAnalyzer()
metrics = await analyzer.calculate_psychological_metrics(content)
# Returns: {aggression_score, persuasion_score, emotional_triggers, cognitive_biases, ...}
```

### MultimodalAnalyzer
```python
from app.ai_engine import MultimodalAnalyzer

analyzer = MultimodalAnalyzer()
result = await analyzer.analyze(
    content="text content",
    content_type="multimodal",
    components={"text": "...", "audio_url": "...", "video_url": "..."}
)
# Returns: {component_analyses, aggregate_trust_score, risk_level, ...}
```

### DatasetManager
```python
from app.ai_engine import DatasetManager

manager = DatasetManager()
# Upload dataset
await manager.upload_dataset("psychology", dataset_file)
# List datasets
datasets = await manager.list_datasets(domain="health")
# Retrain model
job = await manager.schedule_retraining("psychology-001")
```

---

## 📊 Database Schema

### Main Tables
```sql
-- Users
users (id, email, name, organization_id, role, created_at)

-- Analyses
analyses (
    id, user_id, content, content_type, 
    sentiment, credibility, trust_score, risk_level,
    psychological_metrics (JSON), 
    created_at
)

-- Dashboards Data
dashboard_metrics (
    id, user_id, date, metric_name, value,
    period (daily/weekly/monthly)
)

-- Datasets
datasets (
    id, domain, name, total_records, 
    model_performance (JSON),
    created_at
)

-- Favorites/History
user_history (analysis_id, user_id, viewed_at)
favorites (analysis_id, user_id, created_at)
```

---

## 🧪 Testing

### Run All Tests
```bash
cd backend
pytest tests/ -v --cov=app

# Specific test file
pytest tests/test_integration.py -v

# Specific test class
pytest tests/test_integration.py::TestTextAnalysis -v

# Specific test
pytest tests/test_integration.py::TestTextAnalysis::test_analyze_text_endpoint -v
```

### Test Coverage
- Text analysis: 5+ tests
- Multimodal analysis: 3+ tests
- Platform integrations: 7+ tests
- Dataset management: 3+ tests
- Dashboards: 4+ tests
- Error handling: 5+ tests

---

## 🔒 Security Notes

### Authentication
- All protected endpoints require JWT token from Supabase
- Header: `Authorization: Bearer {token}`
- Platform custom keys: `X-API-Key: {key}`

### Environment Variables (Never Commit!)
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SECRET_KEY=your-super-secret-key
```

### CORS
- Configure in `backend/app/core/config.py`
- Whitelist frontend URLs only
- Not `*` in production

### Rate Limiting
- 100 requests/minute per IP
- 1000 requests/day per user
- Configurable in middleware

---

## 🐛 Common Issues & Solutions

### Issue: `ModuleNotFoundError: No module named 'app'`
**Solution**: Run uvicorn from backend directory
```bash
cd backend
uvicorn app.main:app --reload
```

### Issue: `PostgreSQL connection refused`
**Solution**: Start database first
```bash
docker-compose up -d postgres
# Or ensure local postgres is running
psql -U postgres -c "SELECT version();"
```

### Issue: `CORS error from frontend`
**Solution**: Update CORS_ORIGINS in `.env`
```env
CORS_ORIGINS=["http://localhost:5173", "your-frontend-url"]
```

### Issue: `Out of memory errors`
**Solution**: Increase Docker memory limits
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 4G
```

### Issue: `SSL certificate error`
**Solution**: For local development, disable SSL verification (not for production!)
```python
import httpx
async with httpx.AsyncClient(verify=False) as client:
    response = await client.get(url)
```

---

## 📈 Performance Tips

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_trust_score ON analyses(trust_score);

-- Enable full-text search
CREATE INDEX idx_analyses_fts ON analyses 
  USING GIN(to_tsvector('english', content));
```

### Caching Strategy
```python
# Cache expensive AI analysis
import redis

cache = redis.Redis.from_url(settings.REDIS_URL)

# Set with TTL
cache.setex(f"analysis:{content_hash}", 3600, json.dumps(result))

# Get from cache
cached = cache.get(f"analysis:{content_hash}")
if cached:
    return json.loads(cached)
```

### Async All The Things
```python
# ✅ Good - Concurrent requests
tasks = [
    analyzer.analyze(content1),
    analyzer.analyze(content2),
    analyzer.analyze(content3)
]
results = await asyncio.gather(*tasks)

# ❌ Bad - Sequential (slow)
results = [
    await analyzer.analyze(content1),
    await analyzer.analyze(content2),
    await analyzer.analyze(content3)
]
```

---

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Complete API reference, 50+ endpoints |
| [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) | Deploy to AWS/GCP/K8s |
| [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) | Project status, architecture |
| [DELIVERY_SUMMARY.md](DELIVERY_SUMMARY.md) | What's included, verification checklist |
| [README.md](README.md) | Original project overview |

---

## 🎯 Common Development Tasks

### Add a New Endpoint
1. Create function in appropriate router file
2. Add Pydantic schema in `backend/app/schemas/schemas.py`
3. Add database model if needed in `backend/app/models/models.py`
4. Add tests in `backend/tests/test_integration.py`
5. Document in `API_DOCUMENTATION.md`

### Extend AI Analysis
1. Add metric to `TextAnalyzer` or `PsychologicalAnalyzer`
2. Update response schema
3. Add validation/constraints
4. Write tests for new metric
5. Update documentation

### Deploy New Version
```bash
# 1. Make changes and commit
git add -A
git commit -m "feat: New feature description"

# 2. Create release tag
git tag -a v1.0.1 -m "Release 1.0.1"

# 3. Push to trigger CI/CD
git push origin main --tags

# GitHub Actions automatically deploys!
```

---

## 🚢 Deployment Quick Reference

### Local: 2 commands
```bash
docker-compose up -d
# Then open http://localhost:8000
```

### AWS: 1 command
```bash
aws ecs create-service --cluster trust-sense --service-name api ...
```

### Google Cloud: 1 command
```bash
gcloud run deploy trust-sense-api --image gcr.io/project/trust-sense:latest
```

### Kubernetes: 1 command
```bash
kubectl apply -f k8s/deployment.yaml
```

See [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) for full details.

---

## 💬 Getting Help

### Quick Answers
- **What endpoints exist?** → Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **How do I deploy?** → See [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)
- **How do I test?** → Run `pytest tests/ -v`
- **How do I debug?** → Add breakpoint in VSCode, run with debugger

### Deep Dives
- **AI algorithms**: See docstrings in `backend/app/ai_engine/`
- **Database schema**: Run `psql` and `\dt` to see tables
- **Frontend integration**: See `frontend/src/services/api.js`
- **Deployment architecture**: See PRODUCTION_DEPLOYMENT_GUIDE.md diagrams

---

**Version**: 2.0.0 | **Last Updated**: March 5, 2026 | **Status**: Production Ready ✅
