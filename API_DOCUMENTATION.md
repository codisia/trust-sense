# TRUST SENSE AI PLATFORM - Complete API Documentation & Architecture Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [API Architecture](#api-architecture)
3. [AI Engine](#ai-engine)
4. [Multi-Platform Integration](#multi-platform-integration)
5. [Deployment & Infrastructure](#deployment--infrastructure)
6. [Developer Guide](#developer-guide)

---

## System Overview

### Platform Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRUST SENSE AI PLATFORM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Desktop  │  │ Mobile   │  │ Chrome   │  │  Email   │         │
│  │   App    │  │   App    │  │ Ext.     │  │ Plugin   │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │             │               │
│  ┌────┴─────────────┴─────────────┴─────────────┴──────┐        │
│  │         Multi-Platform Integration Router          │        │
│  │  /api/platforms/{desktop,mobile,chrome,email}      │        │
│  └────┬────────────────────────────────────────────────┘        │
│       │                                                          │
│  ┌────┴────────────────────────────────────────────────┐        │
│  │         Multimodal AI Analysis Engine               │        │
│  │  ┌───────────┬──────────┬──────────┐                │        │
│  │  │   Text    │  Audio   │  Video   │                │        │
│  │  │ Analyzer  │ Analyzer │ Analyzer │                │        │
│  │  └─────┬─────┴────┬─────┴────┬─────┘                │        │
│  │        └──────────┼──────────┘                       │        │
│  │                   │                                  │        │
│  │        ┌──────────▼──────────┐                       │        │
│  │        │ Psychological       │                       │        │
│  │        │ Analyzer            │                       │        │
│  │        │ (Trust Scoring)     │                       │        │
│  │        └─────────────────────┘                       │        │
│  └──────────────────┬─────────────────────────────────┘        │
│                     │                                           │
│  ┌──────────────────┴─────────────────────────────────┐        │
│  │  Databases & Storage                               │        │
│  │  - PostgreSQL (Analysis Data)                      │        │
│  │  - Supabase (User Management, Files)               │        │
│  │  - Redis (Caching, Sessions)                       │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Architecture

### Core Endpoints by Domain

#### 1. **Authentication & Users** (`/auth`)
```
POST   /auth/register           - Register new user
POST   /auth/login              - Login and get JWT token
POST   /auth/google-oauth       - Google OAuth login
POST   /auth/supabase-callback  - Supabase auth callback
GET    /auth/profile            - Get current user profile
PUT    /auth/profile            - Update user profile
POST   /auth/logout             - Logout (invalidate token)
POST   /auth/refresh-token      - Refresh JWT token
```

#### 2. **Text Analysis** (`/api/analyze-text`)
```
POST   /api/analyze-text
Request:
{
  "text": "Content to analyze",
  "domain": "psychology|health|military|education|transport",
  "language": "en"
}

Response:
{
  "trust_score": 72.5,
  "risk_level": "LOW",
  "sentiment": 60,
  "fake_news_probability": 15,
  "manipulation_score": 25,
  "credibility": 78,
  "emotional_stability": 85,
  "linguistic_neutrality": 72,
  "content_reliability": 75,
  "dominant_emotion": "neutral",
  "emotions": {
    "joy": 0, "sadness": 0, "anger": 0,
    "fear": 0, "surprise": 0, "disgust": 0
  },
  "psychological_influence_index": 28,
  "aggression_score": 10,
  "deception_score": 15,
  "cognitive_bias_score": 22,
  "persuasion_score": 18,
  "summary": "Content appears trustworthy with standard caution.",
  "recommendations": ["Consider verifying claims", "..."],
  "signals": {...}
}
```

#### 3. **Audio/Video Analysis** (`/api/analyze-audio`, `/api/analyze-video`)
```
POST   /api/analyze-audio
- Extracts speech transcription
- Detects voice emotion and tone
- Analyzes linguistic patterns
- Calculates trust metrics

POST   /api/analyze-video
- Extracts audio transcript
- Detects facial expressions
- Analyzes deepfake probability
- Evaluates speaker credibility
```

#### 4. **Multi-Modal Analysis** (`/api/analyze-multimodal`)
```
POST   /api/analyze-multimodal
Request:
{
  "text": "optional text content",
  "audio_path": "file path or URL",
  "video_path": "file path or URL",
  "domain": "psychology|health"
}

- Combines text, audio, and video analysis
- Produces unified trust score
- Returns integrated psychological profile
```

#### 5. **Platform-Specific APIs** (`/api/platforms/*`)

##### Desktop App
```
POST   /api/platforms/desktop/analyze
GET    /api/platforms/desktop/history

Features:
- Full feature set
- Offline capability
- Local caching
- Batch processing
```

##### Mobile App
```
POST   /api/platforms/mobile/quick-analyze
GET    /api/platforms/mobile/dashboard

Features:
- Lightweight endpoints
- Minimal payload size
- Mobile-optimized responses
```

##### Chrome Extension
```
POST   /api/platforms/chrome/analyze-page
GET    /api/platforms/chrome/health

Features:
- Page content analysis
- Real-time verdict
- API key authentication (no login)
```

##### Email Plugin
```
POST   /api/platforms/email/analyze-message

Features:
- Phishing detection
- Spam classifier
- Malicious intent detection
```

##### Social Media Chatbots
```
POST   /api/chatbot/facebook/webhook      - Facebook Messenger
POST   /api/chatbot/whatsapp/analyze      - WhatsApp Bot
POST   /api/chatbot/telegram/analyze      - Telegram Bot
GET    /api/chatbot/status                - Chatbot health check
```

#### 6. **Dashboards & Reports** (`/api/dashboards`)
```
GET    /api/dashboards/personal           - Personal dashboard
GET    /api/dashboards/organization       - Organization dashboard
GET    /api/dashboards/reports/pdf        - Export PDF report
GET    /api/dashboards/reports/csv        - Export CSV data
GET    /api/dashboards/analytics/trends   - Trend analytics
GET    /api/dashboards/analytics/domains  - Domain breakdown
```

#### 7. **Datasets** (`/api/datasets`)
```
POST   /api/datasets/upload/{domain}      - Upload annotated dataset
GET    /api/datasets/list                 - List available datasets
GET    /api/datasets/{id}/info            - Dataset metadata
GET    /api/datasets/{id}/samples         - Sample records
POST   /api/datasets/{id}/retrain         - Trigger model retraining
GET    /api/datasets/{id}/training-status - Training job status
```

---

## AI Engine

### Architecture

The AI engine consists of four main analyzers:

#### 1. **Text Analyzer**
Analyzes text content using NLP techniques.

**Metrics Calculated:**
- Sentiment Analysis (0-100)
- Credibility Score (0-100)
- Fake News Probability (0-100)
- Manipulation Detection (0-100)
- Linguistic Neutrality (0-100)
- Content Reliability (0-100)

**Input Processing:**
```
Text Input → Preprocessing → Feature Extraction → Analysis → Scoring
```

**Features Analyzed:**
- Specific dates and numbers
- Citation presence
- Evidence language
- Named entities
- Vague language
- Sensationalism indicators

#### 2. **Audio Analyzer**
Processes audio files for speech and emotional content.

**Capabilities:**
- Speech-to-Text transcription (requires API: Google Cloud, Azure)
- Voice emotion detection
- Speaker identification
- Audio quality assessment
- Speech rate analysis
- Accent detection

**Output:**
- Transcript text (forwarded to Text Analyzer)
- Voice emotion: happy, sad, angry, fearful, surprised, neutral
- Voice emotion score: 0-100
- Audio quality metrics

#### 3. **Video Analyzer**
Performs comprehensive video content analysis.

**Capabilities:**
- Frame extraction and analysis
- Facial emotion detection
- Deepfake probability (0-100)
- Facial expression tracking
- Hand gesture recognition
- Scene and text (OCR) extraction
- Speech transcription (from audio track)

**Outputs:**
- Video quality metrics
- Face count and identity
- Deepfake confidence scores
- Facial emotion distribution
- Text elements found in video
- Transcript (from audio)

#### 4. **Psychological Analyzer**
Core component that calculates psychological influence metrics.

**Emotional Response Trigger Analysis:**
```
Triggers:
- Fear words: danger, threat, crisis, terror...
- Anger words: outrage, fury, hostile, brutal...
- Anxiety words: uncertain, worried, stressed...
- Sadness words: tragic, devastating, loss...
- Happiness words: happy, wonderful, amazing...
- Excitement words: shocking, unbelievable, wow...
```

**Cognitive Bias Detection:**
```
Biases Detected:
1. Confirmation Bias
   - Asserting without evidence
   - Keywords: "obviously", "clearly", "no doubt"

2. Urgency Bias
   - Time pressure language
   - Keywords: "immediately", "limited time", "act now"

3. Polarization
   - Us vs them language
   - Black and white thinking

4. Absolute Thinking
   - Always/never patterns
   - Impossibility claims

5. Generalization
   - Everyone/all patterns
   - Overgeneralizations
```

**Manipulation Pattern Detection:**
- Social proof appeals ("experts agree", "most people")
- Fear appeals ("if you don't", "serious consequences")
- Scarcity appeals ("limited", "running out")
- False authority
- Victimhood narratives

**Aggression Analysis:**
```
Signals:
- Insulting language count
- ALL CAPS excess
- Exclamation mark frequency (!)
- Aggressive vocabulary
Score: 0-100
```

**Deception Indicators:**
```
Signals:
- Vague language (some, many, often)
- Passive voice usage (less accountability)
- Emotion overwhelming evidence
- Absence of specifics (dates, numbers)
- Unusual punctuation (..., --)
Score: 0-100
```

**Persuasion Techniques:**
- Rhetorical questions
- Repetition patterns
- Emotional appeals
- Bandwagon effects
- Expert appeals
- Authority appeals

**Psychological Influence Index (PII) Calculation:**

```
PII = (Aggression×0.25) + (Deception×0.25) + (CognitiveBias×0.25) + (Persuasion×0.15) + (Emotions×0.10)

Range: 0-100
- 0-30: Low psychological influence
- 30-60: Moderate influence
- 60-80: High influence
- 80-100: Extreme psychological manipulation
```

**Trust Score Calculation:**

```
TrustScore = (Credibility×0.25) + (InverseDeception×0.20) 
             + (InverseAggression×0.20) + (InverseEmotional×0.20) 
             + (InverseInfluence×0.15)

Range: 0-100
- 0-30: Very low trust (unreliable)
- 30-50: Low trust (questionable)
- 50-70: Moderate trust (acceptable)
- 70-85: High trust (reliable)
- 85-100: Very high trust (verified)
```

---

## Multi-Platform Integration

### Desktop App Backend

**Responsibilities:**
- Full feature analysis (text, audio, video)
- Batch processing support
- Local caching and sync
- Offline capability
- Historical data management

**Sample Integration:**
```python
import requests

backend_url = "http://localhost:8000"
auth_token = "eyJhbGc..."

# Analyze content
response = requests.post(
    f"{backend_url}/api/platforms/desktop/analyze",
    headers={"Authorization": f"Bearer {auth_token}"},
    data={
        "content": "Text to analyze",
        "content_type": "text",
        "domain": "psychology"
    }
)

# Get history
history = requests.get(
    f"{backend_url}/api/platforms/desktop/history?limit=50",
    headers={"Authorization": f"Bearer {auth_token}"}
)
```

### Mobile App Backend

**Characteristics:**
- Lightweight payloads
- Quick response times
- Minimal data transfer
- Mobile-optimized endpoints

**Quick Analysis Endpoint:**
```
POST /api/platforms/mobile/quick-analyze
Response: {
  "trust_score": 72,
  "risk_level": "LOW",
  "summary": "...",
  "emotion": "neutral",
  "recommendation": "..."
}
```

### Chrome Extension Backend

**Flow:**
1. User visits webpage
2. Extension captures page content
3. Sends to `/api/platforms/chrome/analyze-page`
4. Backend returns instant verdict
5. Extension displays badge with trust score

**Authentication:** API key (no user login needed)

### Email Plugin Backend

**Capabilities:**
- Phishing detection
- Spam classification
- Malicious intent scoring
- Safe-to-open verdict

### Social Media Chatbot Backend

**Supported Platforms:**
- Facebook Messenger
- WhatsApp
- Telegram

**Bot Flow:**
1. User sends message to chatbot
2. Message forwarded to `/api/chatbot/{platform}/analyze`
3. Backend returns trust assessment
4. Bot responds with verdict and recommendations

---

## Deployment & Infrastructure

### Docker Setup

**Multi-Stage Build Process:**
```dockerfile
Stage 1 (Builder):
- Install build dependencies
- Create wheels from requirements

Stage 2 (Runtime):
- Install only runtime dependencies
- Copy wheels from builder
- Reduced final image size
- Non-root user for security
- Health checks included
```

**Container Resources:**
```yaml
Backend API:
  Memory: 2GB-4GB
  CPU: 1-2 cores
  Disk: 10GB
  
PostgreSQL:
  Memory: 4GB+
  CPU: 2-4 cores
  Disk: 100GB+ (depending on data)
  
Redis:
  Memory: 1GB-2GB
  CPU: 1 core
```

### CI/CD Pipeline

**Stages:**
1. **Code Quality** - Linting, formatting, type checking
2. **Unit Tests** - Python unit tests with pytest
3. **Docker Build** - Multi-stage build and registry push
4. **Security Scanning** - Vulnerability scanning with Trivy
5. **Integration Tests** - API endpoint testing
6. **Deploy to Staging** - On develop branch
7. **Deploy to Production** - On main branch with tags
8. **Notifications** - Slack alerts on status

**GitHub Actions Workflows:**
- `ci-cd.yml` - Main CI/CD pipeline
- `security.yml` - Weekly security audits
- `performance-test.yml` - Load testing

### Kubernetes Deployment (Optional)

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trust-sense-api
  labels:
    app: trust-sense
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trust-sense
  template:
    metadata:
      labels:
        app: trust-sense
    spec:
      containers:
      - name: api
        image: ghcr.io/trust-sense/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        livenessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Developer Guide

### Local Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/trust-sense.git
cd trust-sense

# 2. Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Run migrations
python -m alembic upgrade head

# 5. Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API Docs: http://localhost:8000/docs
```

### Adding New Endpoints

```python
# 1. Create new router file (app/routers/new_feature.py)
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/new-feature", tags=["New Feature"])

@router.post("/analyze")
async def analyze(data: dict, current_user: User = Depends(get_current_user)):
    return {"status": "success"}

# 2. Register in main.py
from app.routers import new_feature
app.include_router(new_feature.router, tags=["New Feature"])

# 3. Add tests
# tests/test_new_feature.py
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/test_analysis.py::test_text_analysis

# Run with verbose output
pytest -v
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Description of change"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Performance & Scalability

### Caching Strategy

```
- Redis for session management
- Query result caching (5-60 minutes)
- User analysis history cached
- Domain datasets cached after first load
```

### Database Optimization

```
- Indexes on frequently queried columns:
  - user_id, organization_id
  - created_at (for date range queries)
  - trust_score, risk_level (for filtering)
- Partitioning large tables by date range
- Connection pooling (min:5, max:20)
```

### API Rate Limiting

```
- Free tier: 100 requests/hour
- Pro tier: 10,000 requests/hour
- Enterprise: Unlimited
- Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining
```

### Monitoring & Logging

```
- Application metrics: Prometheus
- Log aggregation: ELK Stack or Datadog
- Distributed tracing: Jaeger
- Health checks: /health endpoint
- Performance monitoring: APM tools
```

---

## Security Considerations

### Authentication
- JWT tokens with 24-hour expiration
- Refresh tokens (7-day expiration)
- OAuth 2.0 integration (Google, GitHub)
- Supabase authentication for user management

### Data Protection
- Encryption at rest (PostgreSQL native encryption)
- Encryption in transit (HTTPS/TLS)
- Sensitive data hashing (passwords: bcrypt)
- PII redaction in logs

### API Security
- CORS configuration
- Rate limiting
- Input validation (FastAPI automatic)
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection (output encoding)

### Deployment Security
- Non-root container user
- Health checks (restart on failure)
- Network policies (k8s)
- Secret management (GitHub Secrets, HashiCorp Vault)
- Regular dependency updates
- Security scanning (Trivy, CodeQL)

---

## Troubleshooting

### Common Issues

**Issue: Database connection timeout**
```bash
# Check PostgreSQL service is running
systemctl status postgresql

# Test connection
psql -U postgres -h localhost

# Check DATABASE_URL in .env
```

**Issue: AI Engine not responding**
```bash
# Ensure all dependencies installed
pip install -r requirements-ai.txt

# Check AI engine logs
python -c "from app.ai_engine import MultimodalAnalyzer; analyzer = MultimodalAnalyzer()"
```

**Issue: Authentication failing**
```bash
# Verify JWT secret in .env
# Check token expiration
# Ensure Supabase credentials are correct
```

For more support, visit: [GitHub Issues](https://github.com/yourrepo/issues)

---

**Version:** 2.0.0  
**Last Updated:** March 5, 2026  
**Status:** Production Ready ✅
