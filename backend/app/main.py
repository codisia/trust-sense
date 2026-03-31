from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.routers import auth, analysis, audio_video, powerbi, organizations, social_media, google_trends, platforms, datasets, dashboards, chatbot, user, payments, news
from app.core.database import engine, Base, get_db
from app.core.config import settings
from app.core.deps import require_admin
from app.websocket_manager import ws_manager
from app.models.models import User, Analysis
from codexia_platform.ai_news.scheduler import start_scheduler
from sqlalchemy.orm import Session
from fastapi import Depends
import time
import os
import sys

# Add parent directory to path so codexia_platform can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

Base.metadata.create_all(bind=engine)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# CORS: use env in production, default allow all for dev
_cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()] if settings.CORS_ORIGINS != "*" else ["*"]

app = FastAPI(
    title="Trust Sense API",
    version="2.0.0",
    description="Enterprise-grade AI for multimodal content analysis",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Mount static files from frontend build
static_dir = "/app/frontend/dist"
if os.path.exists(static_dir):
    # Mount assets separately to avoid conflicts with SPA routing
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Request logging middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-API-Version"] = "2.0.0"
    return response

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": str(exc),
            "type": type(exc).__name__,
        },
    )

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(organizations.router, tags=["Organizations"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(audio_video.router, prefix="/api", tags=["Media Analysis"])
app.include_router(chatbot.router, tags=["Chatbot"])
app.include_router(powerbi.router, prefix="/api", tags=["Power BI Integration"])
app.include_router(google_trends.router, prefix="/api", tags=["Google Trends"])
app.include_router(social_media.router, tags=["Social Media Integration"])
app.include_router(platforms.router, tags=["Multi-Platform Apps"])
app.include_router(datasets.router, tags=["Dataset Management"])
app.include_router(dashboards.router, tags=["Dashboards & Reports"])
app.include_router(news.router, tags=["News"])
app.include_router(user.router, tags=["User Preferences"])
app.include_router(payments.router, tags=["Payments"])


@app.on_event("startup")
def startup_event():
    """Start background processes (scheduler, etc.)"""
    try:
        start_scheduler()  # Start news scheduler
    except Exception:
        pass


# Moved root status endpoint to /api/status to avoid SPA routing conflict
@app.get("/api/status", tags=["Health"])
def api_status():
    return {
        "status": "online",
        "service": "Trust Sense API",
        "version": "2.0.0",
        "message": "Enterprise-grade AI verification platform",
        "documentation": "http://localhost:8000/docs",
        "endpoints": {
            "text": "/api/analyze-text",
            "audio": "/api/analyze-audio",
            "video": "/api/analyze-video",
            "image": "/api/analyze-image",
            "multimodal": "/api/analyze-multimodal",
            "history": "/api/analysis-history",
            "status": "/api/status",
            "live": "ws://localhost:8000/ws/live",
        },
        "roles": ["admin", "analyst", "viewer"],
    }

@app.get("/health", tags=["Health"])
def health(db: Session = Depends(get_db)):
    """Health check including database connectivity."""
    db_ok = True
    try:
        db.query(User).limit(1).first()
    except Exception:
        db_ok = False
    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": time.time(),
        "service": "Trust Sense",
        "version": "2.0.0",
        "database": "ok" if db_ok else "error",
    }

@app.get("/api/stats", tags=["Statistics"])
def get_stats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Platform statistics — Admin only."""
    try:
        total_analyses = db.query(Analysis).count()
        active_users = db.query(User).filter(User.is_active == 1).count()
    except Exception:
        total_analyses = 0
        active_users = 0
    return {
        "status": "success",
        "data": {
            "totalAnalyses": total_analyses,
            "activeUsers": active_users,
            "accuracy": 99.2,
            "processingTime": "< 100ms",
            "uptime": "99.99%",
        },
    }


@app.get("/api/stats/summary", tags=["Statistics"])
def get_stats_public(db: Session = Depends(get_db)):
    """Public summary stats for dashboards (no auth)."""
    try:
        total_analyses = db.query(Analysis).count()
        active_users = db.query(User).filter(User.is_active == 1).count()
    except Exception:
        total_analyses = 0
        active_users = 0
    return {
        "status": "success",
        "data": {
            "totalAnalyses": total_analyses,
            "activeUsers": active_users,
            "processingTime": "< 100ms",
        },
    }


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for live updates and real-time alerts."""
    try:
        await ws_manager.connect(websocket)
        while True:
            # Keep connection alive and receive messages
            data = await websocket.receive_text()
            if data:
                # Broadcast heartbeat or echo back
                await ws_manager.broadcast({
                    "type": "ping",
                    "message": "kept alive"
                })
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        ws_manager.disconnect(websocket)



# Catch-all route for SPA routing - serves index.html for any non-API route
@app.get("/{path:path}")
async def serve_spa(path: str):
    """Serve the React SPA for all non-API routes."""
    # Only serve SPA for non-API, non-assets, non-docs, non-health, non-websocket, non-auth paths
    if path.startswith(("api/", "auth/", "docs", "redoc", "openapi", "health", "ws/", "assets/")):
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    if os.path.exists(static_dir):
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            from fastapi.responses import FileResponse
            return FileResponse(index_path, media_type="text/html")
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=404, content={"detail": "Frontend not found"})



