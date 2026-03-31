# Trust Sense — Full AI Intelligence Platform

> **Production-ready**, scalable AI platform for **trust and credibility analysis** of text, audio, video, and images.  
> **Backend:** Python 3.11 + FastAPI + SQLAlchemy + Claude/HuggingFace + WebSockets  
> **Frontend:** React 18 + Vite + TailwindCSS + Recharts  
> **Security:** JWT, RBAC (Admin / Analyst / Viewer), CORS, rate limiting

📄 **Full project description:** see **[PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md)** — vision, features, tech stack, structure, API, security, deployment, and roadmap.

---

## ⚡ Quick Start (5 minutes)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure .env with API keys (see below)
# nano .env  or  code .env

# Start the API server
python -m uvicorn app.main:app --reload --port 8000
```

Backend: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: **http://localhost:5173**

### 3. Configure API Keys

Edit `backend/.env`:

```env
# NLP Engines
ANTHROPIC_API_KEY=sk-ant-...     # https://console.anthropic.com
HUGGINGFACE_API_KEY=hf_...       # https://huggingface.co/settings/tokens

# Power BI Integration (Optional)
POWERBI_DATASET_ID=your-dataset-id
POWERBI_TOKEN=your-powerbi-token
```

---

## 🎯 Modules & Features

### **Text Analysis** ✅
- Trust score (0-100)
- Sentiment analysis (-1 to +1)
- Fake news probability
- Manipulation detection
- Emotional signals
- Language analysis

```bash
curl -X POST http://localhost:8000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text":"Some text to analyze"}'
```

### **Audio Analysis** ✅
- Speech-to-text transcription
- Voice emotion detection (joy, sadness, anger, fear, neutral)
- Pitch & energy metrics
- Transcript credibility analysis

```bash
curl -X POST http://localhost:8000/api/analyze-audio \
  -F "file=@speech.mp3"
```

### **Video Analysis** ✅
- Deepfake detection (FaceNet512 embeddings)
- Facial emotion analysis (7 emotions)
- Face consistency scoring
- Frame-by-frame emotion timeline

```bash
curl -X POST http://localhost:8000/api/analyze-video \
  -F "file=@video.mp4"
```

### **Multimodal Analysis** ✅
- Combined audio + video analysis
- Cross-modal consistency checking
- Integrated risk assessment

```bash
curl -X POST http://localhost:8000/api/analyze-multimodal \
  -F "audio_file=@audio.mp3" \
  -F "video_file=@video.mp4"
```

### **Image Analysis** ✅
- OCR (optical character recognition)
- Image description & understanding
- Visual credibility assessment

### **Power BI Integration** ✅
- Real-time data sync
- Custom dashboards
- Visualization & reporting
- REST API integration

---

## 📁 Project Structure

```
trust-sense/
├── backend/
│   ├── app/
│   │   ├── main.py                      # FastAPI app entry
│   │   ├── core/
│   │   │   ├── config.py                # Settings (UPDATED)
│   │   │   ├── database.py              # SQLAlchemy
│   │   │   └── security.py              # JWT & auth
│   │   ├── models/
│   │   │   └── models.py                # DB models (UPDATED)
│   │   ├── routers/
│   │   │   ├── auth.py                  # Authentication
│   │   │   ├── analysis.py              # Text analysis
│   │   │   └── audio_video.py           # AV analysis (NEW)
│   │   └── services/
│   │       ├── nlp_service.py           # Claude+HuggingFace (ENHANCED)
│   │       ├── av_service.py            # Audio/Video (NEW)
│   │       └── powerbi_service.py       # Power BI (NEW)
│   ├── requirements.txt                 # ALL deps (UPDATED)
│   └── .env                             # Config (UPDATED)
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        └── services/api.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login, get JWT |
| **POST** | **`/api/analyze-text`** | **Text analysis** |
| **POST** | **`/api/analyze-audio`** | **Audio analysis** |
| **POST** | **`/api/analyze-video`** | **Video analysis** |
| **POST** | **`/api/analyze-multimodal`** | **Combined A/V** |
| **GET** | **`/api/powerbi-status`** | **Power BI status** |
| **POST** | **`/api/powerbi-sync`** | **Manual sync** |
| GET | `/api/analysis-history` | History (auth) |
| GET | `/api/stats` | Statistics (admin only) |
| GET | `/api/stats/summary` | Public summary stats |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| WebSocket | `/ws/live` | Live alerts |

---

## 🧠 NLP Engine Features

### **Primary: Anthropic Claude**
- Advanced reasoning
- Image analysis (with vision)
- Structured JSON output
- Multilingual support

### **Fallback: HuggingFace**
- Distilbert sentiment analysis
- Local model caching
- No API key required
- Fast inference

### **Graceful Degradation**
```
1. Try Claude API
2. If unavailable → Fall back to HuggingFace
3. If HuggingFace fails → Use rule-based analysis
```

---

## 📊 Power BI Integration

Real-time data sync from Trust Sense to Power BI dashboards.

**Setup**: Follow [POWERBI_SETUP.md](POWERBI_SETUP.md)

**Synced Data**:
- Analysis ID, User ID, Input Type
- Trust Score, Sentiment, Credibility
- Risk Level, Emotions, Timestamps
- Deepfake Probability, Voice Emotion

**Triggers**:
- Automatic on analysis completion
- Manual via `/api/powerbi-sync` endpoint
- Batch sync via background jobs

---

## 🎓 Usage Examples

### Python
```python
import requests

# Text analysis
response = requests.post(
    "http://localhost:8000/api/analyze-text",
    json={"text": "Breaking news about AI safety"}
)
print(response.json()["trust_score"])

# Audio analysis
with open("speech.mp3", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/analyze-audio",
        files={"file": f}
    )
print(response.json()["voice_emotion"])
```

### JavaScript/React
```javascript
// Text analysis
const response = await fetch("http://localhost:8000/api/analyze-text", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Some text..." })
});
const result = await response.json();
console.log(result.trust_score);
```

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for more examples.

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **[PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md)** | **Full project description** — vision, features, stack, API, security, deployment |
| [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) | Tech roadmap, phases, free hosting link |
| [HOSTING.md](HOSTING.md) | Step-by-step free hosting (Vercel, Render, Upstash) |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Setup & architecture (if present) |
| [POWERBI_SETUP.md](POWERBI_SETUP.md) | Power BI configuration (if present) |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Code examples (if present) |

---

## 🔐 Security Features

- JWT authentication
- Password hashing (bcrypt)
- **RBAC:** Admin, Analyst, Viewer roles
- CORS (configurable via `CORS_ORIGINS`)
- Rate limiting by subscription tier
- Environment variable secrets

---

## 📈 Performance

- **Text**: < 500ms per analysis
- **Audio**: 2-5s (depends on file size)
- **Video**: 5-15s (depends on length)
- **Batch sync**: Bulk Power BI uploads

---

## 🚀 Deployment

### Docker
```bash
docker compose up -d --build
```
Frontend: http://localhost:5173 — Backend: http://localhost:8000 — Redis: 6379

### Free hosting (Vercel + Render)
See **[HOSTING.md](HOSTING.md)** for step-by-step free deployment.

### Other
- **Railway / Heroku:** Connect repo; set root dir and env (see HOSTING.md).
- **render.yaml** included for Render Web Service (root directory: `backend`).

---

## 🔧 System Requirements

- Python 3.11+
- Node.js 16+
- 4GB RAM minimum
- Optional: FFmpeg, Tesseract OCR

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL=sqlite:///./trust_sense.db

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# NLP
ANTHROPIC_API_KEY=sk-ant-...
HUGGINGFACE_API_KEY=hf_...

# Power BI
POWERBI_DATASET_ID=...
POWERBI_TOKEN=...
POWERBI_API_URL=https://api.powerbi.com/v1.0/myorg
POWERBI_TABLE_NAME=AnalysisResults
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Verify backend running on :8000 |
| "Analysis failed" | Check API key, restart backend |
| Video processing slow | Reduce video size, use GPU |
| Power BI sync fails | Verify token/dataset ID |

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md#troubleshooting) for detailed fixes.

---

## 📋 Feature Checklist

- ✅ Text analysis with Claude + HuggingFace + psychological analysis
- ✅ Audio transcription & emotion detection
- ✅ Video deepfake detection & facial emotions
- ✅ Image OCR & analysis
- ✅ Social media import (multiple platforms)
- ✅ Power BI real-time sync (optional)
- ✅ JWT auth + RBAC (Admin / Analyst / Viewer)
- ✅ WebSockets (/ws/live) for live alerts
- ✅ SQLite / PostgreSQL + Redis (Docker)
- ✅ REST API with Swagger docs
- ✅ React + Vite + TailwindCSS frontend
- ✅ Docker + CI/CD (GitHub Actions)
- ✅ Free hosting guide (Vercel + Render)
- ✅ Production-ready code

---

## 📞 Support

- **API Docs**: http://localhost:8000/docs (Swagger)
- **Claude**: https://docs.anthropic.com
- **HuggingFace**: https://huggingface.co/docs
- **Power BI**: https://learn.microsoft.com/power-bi
- **FastAPI**: https://fastapi.tiangolo.com

---

**Version**: 2.0.0  
**Status**: Production Ready ✅  
**Last Updated**: March 2025

