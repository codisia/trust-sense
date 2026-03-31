"""Audio/Video Analysis Router for Trust Sense API."""

from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session  # noqa: F401
from typing import Optional
import os

from app.core.database import get_db
from app.core.security import decode_token
from app.models.models import User, Analysis, Organization
from app.services.av_service import (
    extract_speech_transcript,
    detect_voice_emotion,
    detect_deepfake_video,
    analyze_facial_emotions,
    integrated_av_analysis
)
from app.services.nlp_service import analyze_text
from app.services.powerbi_service import sync_analysis_to_powerbi
from pydantic import BaseModel

router = APIRouter()


class AudioAnalysisRequest(BaseModel):
    audio_url: str = None
    analyze_transcript: bool = True
    analyze_emotion: bool = True


class VideoAnalysisRequest(BaseModel):
    video_url: str = None
    detect_deepfake: bool = True
    analyze_facial_emotions: bool = True


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    """Extract and validate JWT token from Authorization header.
    Returns None if invalid/missing, raises HTTPException if token is invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1]
        payload = decode_token(token)
        if not payload:
            return None
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        return user
    except (IndexError, ValueError, TypeError) as e:
        return None


def get_default_org_id(db: Session) -> int:
    """Get or create demo organization for analyses."""
    org = db.query(Organization).filter(Organization.slug == "demo").first()
    if not org:
        user = db.query(User).first()
        org = Organization(
            name="Demo Organization",
            slug="demo",
            owner_id=user.id if user else 1,
            tier="free",
            is_active=True,
        )
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.id


@router.post("/analyze-audio")
def analyze_audio_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Analyze audio file: speech-to-text and emotional tone detection."""
    try:
        # Save uploaded file temporarily
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            content = file.file.read()
            f.write(content)
        
        # Extract speech
        transcript_result = extract_speech_transcript(temp_path)
        
        # Detect voice emotion
        emotion_result = detect_voice_emotion(temp_path)
        
        # Analyze transcript if successful
        transcript_analysis = None
        if transcript_result.get("success") and transcript_result.get("transcript"):
            transcript_analysis = analyze_text(transcript_result["transcript"])
        
        # Store in database
        user_id = current_user.id if current_user else 1
        org_id = get_default_org_id(db)

        analysis = Analysis(
            user_id=user_id,
            organization_id=org_id,
            input_type="audio",
            raw_input=transcript_result.get("transcript", "")[:500],
            speech_transcript=transcript_result.get("transcript", ""),
            voice_emotion=emotion_result.get("emotion", "unknown"),
            voice_emotion_score=emotion_result.get("confidence", 0),
            # Copy metrics from transcript analysis if available
            trust_score=transcript_analysis.get("trust_score") if transcript_analysis else 50.0,
            sentiment=transcript_analysis.get("sentiment") if transcript_analysis else 0.0,
            credibility=transcript_analysis.get("credibility") if transcript_analysis else 0.5,
            emotional_stability=transcript_analysis.get("emotional_stability") if transcript_analysis else 0.5,
            linguistic_neutrality=transcript_analysis.get("linguistic_neutrality") if transcript_analysis else 0.5,
            content_reliability=transcript_analysis.get("content_reliability") if transcript_analysis else 0.5,
            fake_news_probability=transcript_analysis.get("fake_news_probability") if transcript_analysis else 0.0,
            manipulation_score=transcript_analysis.get("manipulation_score") if transcript_analysis else 0.0,
            dominant_emotion=transcript_analysis.get("dominant_emotion") if transcript_analysis else emotion_result.get("emotion", "neutral"),
            risk_level=transcript_analysis.get("risk_level") if transcript_analysis else "LOW",
            emotions_json=emotion_result.get("emotion_scores", {}),
            signals_json=[
                f"Speech transcript extracted: {len(transcript_result.get('transcript', ''))} characters",
                f"Voice emotion: {emotion_result.get('emotion')} (confidence: {emotion_result.get('confidence')})",
                f"Pitch: {emotion_result.get('pitch'):.2f}",
                f"Energy level: {emotion_result.get('energy'):.2f}"
            ],
            summary=f"Audio analysis detected {emotion_result.get('emotion')} emotion with {emotion_result.get('confidence')*100:.1f}% confidence.",
        )
        
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        # Sync to Power BI
        sync_analysis_to_powerbi(analysis.id, db)
        
        # Clean up temp file
        os.remove(temp_path)
        
        return {
            "analysis_id": analysis.id,
            "transcript": transcript_result,
            "voice_emotion": emotion_result,
            "text_analysis": transcript_analysis,
            "stored": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/analyze-video")
def analyze_video_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Analyze video file: deepfake detection and facial emotion analysis."""
    try:
        # Save uploaded file temporarily
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            content = file.file.read()
            f.write(content)
        
        # Detect deepfake
        deepfake_result = detect_deepfake_video(temp_path)
        
        # Analyze facial emotions
        facial_emotions = analyze_facial_emotions(temp_path)
        
        # Store in database
        user_id = current_user.id if current_user else 1
        org_id = get_default_org_id(db)

        # Calculate trust score based on deepfake detection
        deepfake_prob = deepfake_result.get("is_deepfake_probability", 0)
        trust_score = max(0, 100 - (deepfake_prob * 100))
        risk_level = "CRITICAL" if deepfake_prob > 0.8 else "HIGH" if deepfake_prob > 0.6 else "MEDIUM" if deepfake_prob > 0.3 else "LOW"
        
        # Get dominant emotion from facial analysis
        dominant_emotion = "unknown"
        if facial_emotions.get("dominant_emotions"):
            emotion_counts = {}
            for emotion in facial_emotions["dominant_emotions"]:
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            dominant_emotion = max(emotion_counts, key=emotion_counts.get)
        
        analysis = Analysis(
            user_id=user_id,
            organization_id=org_id,
            input_type="video",
            raw_input=f"Video: {file.filename}",
            deepfake_probability=deepfake_prob,
            facial_emotions_json=facial_emotions.get("average_emotions", {}),
            trust_score=trust_score,
            sentiment=0.0,
            credibility=1 - deepfake_prob,
            emotional_stability=0.7,
            linguistic_neutrality=0.8,
            content_reliability=1 - deepfake_prob,
            fake_news_probability=deepfake_prob,
            manipulation_score=deepfake_prob,
            dominant_emotion=dominant_emotion,
            risk_level=risk_level,
            emotions_json=facial_emotions.get("average_emotions", {}),
            signals_json=[
                f"Deepfake probability: {deepfake_prob*100:.1f}%",
                f"Face consistency: {deepfake_result.get('face_consistency', 0)*100:.1f}%",
                f"Frames analyzed: {deepfake_result.get('frames_analyzed')}",
                f"Dominant facial emotion: {dominant_emotion}"
            ],
            summary=f"Video analysis detected {dominant_emotion} emotion. Deepfake probability: {deepfake_prob*100:.1f}%. Risk level: {risk_level}.",
        )
        
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        # Sync to Power BI
        sync_analysis_to_powerbi(analysis.id, db)
        
        # Clean up temp file
        os.remove(temp_path)
        
        return {
            "analysis_id": analysis.id,
            "deepfake_detection": deepfake_result,
            "facial_emotions": facial_emotions,
            "trust_score": trust_score,
            "risk_level": risk_level,
            "stored": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/analyze-multimodal")
def analyze_multimodal_endpoint(
    audio_file: UploadFile = File(None),
    video_file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Integrated audio-video analysis combining all detection methods."""
    try:
        audio_path = None
        video_path = None
        
        if audio_file:
            audio_path = f"/tmp/{audio_file.filename}"
            with open(audio_path, "wb") as f:
                f.write(audio_file.file.read())
        
        if video_file:
            video_path = f"/tmp/{video_file.filename}"
            with open(video_path, "wb") as f:
                f.write(video_file.file.read())
        
        # Integrated analysis
        result = integrated_av_analysis(audio_path, video_path)
        
        # Store combined analysis
        user_id = current_user.id if current_user else 1
        
        # Combine scores
        combined_score = result.get("combined_score", 0)
        trust_score = max(0, 100 - (combined_score * 100))
        risk_level = result.get("risk_assessment", "LOW")
        
        voice_emotion = None
        deepfake_prob = None
        
        if result.get("audio_analysis"):
            voice_emotion = result["audio_analysis"].get("voice_emotion", {}).get("emotion")
        if result.get("video_analysis"):
            deepfake_prob = result["video_analysis"].get("deepfake_detection", {}).get("is_deepfake_probability")
        
        analysis = Analysis(
            user_id=user_id,
            input_type="multimodal",
            raw_input=f"Audio: {audio_file.filename if audio_file else 'none'} | Video: {video_file.filename if video_file else 'none'}",
            speech_transcript=result.get("audio_analysis", {}).get("transcript", {}).get("transcript"),
            voice_emotion=voice_emotion,
            voice_emotion_score=result.get("audio_analysis", {}).get("voice_emotion", {}).get("confidence", 0),
            deepfake_probability=deepfake_prob,
            trust_score=trust_score,
            sentiment=0.0,
            credibility=1 - combined_score,
            emotional_stability=0.7,
            linguistic_neutrality=0.8,
            content_reliability=1 - combined_score,
            fake_news_probability=combined_score,
            manipulation_score=combined_score,
            dominant_emotion=voice_emotion or "unknown",
            risk_level=risk_level,
            emotions_json={},
            signals_json=[
                f"Combined analysis score: {combined_score*100:.1f}%",
                f"Voice emotion: {voice_emotion or 'N/A'}",
                f"Deepfake probability: {deepfake_prob*100:.1f if deepfake_prob else 0}%",
            ],
            summary=f"Multimodal analysis completed. Risk level: {risk_level}.",
        )
        
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        # Sync to Power BI
        sync_analysis_to_powerbi(analysis.id, db)
        
        # Clean up temp files
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
        
        return {
            "analysis_id": analysis.id,
            "analysis_result": result,
            "trust_score": trust_score,
            "risk_level": risk_level,
            "stored": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/powerbi-status")
def get_powerbi_status(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Check Power BI integration status."""
    from app.services.powerbi_service import PowerBIClient
    
    client = PowerBIClient()
    
    if not client.is_configured():
        return {
            "configured": False,
            "message": "Power BI not configured. Set POWERBI_DATASET_ID and POWERBI_TOKEN in .env"
        }
    
    dataset_info = client.get_dataset_info()
    
    # Count synced/unsynced analyses
    from app.models.models import Analysis
    total = db.query(Analysis).count()
    synced = db.query(Analysis).filter(Analysis.powerbi_synced == 1).count()
    unsynced = total - synced
    
    return {
        "configured": True,
        "dataset_info": dataset_info,
        "sync_status": {
            "total_analyses": total,
            "synced": synced,
            "unsynced": unsynced
        }
    }


@router.post("/powerbi-sync")
def sync_to_powerbi(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Manually trigger Power BI synchronization for unsynced analyses."""
    from app.services.powerbi_service import sync_all_analyses_to_powerbi
    
    result = sync_all_analyses_to_powerbi(db)
    return result
