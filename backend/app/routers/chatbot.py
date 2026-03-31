"""Chatbot API endpoints"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from pydantic import BaseModel
from app.services.chatbot_service import get_chatbot_response, analyze_with_multiple_models
from app.ai_engine.audio_video_analyzers import AudioAnalyzer
from app.core.deps import get_db

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    success: bool
    model: str = "groq"


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatMessage):
    """Get conversational response from AI assistant"""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    result = get_chatbot_response(request.message)
    return ChatResponse(**result)


@router.post("/voice-chat")
async def voice_chat(audio_file: UploadFile = File(...)):
    """Chat with voice input - transcribe audio and respond"""
    try:
        import tempfile
        import os
        # Save temp file
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, audio_file.filename)
        with open(temp_path, "wb") as f:
            f.write(await audio_file.read())
        
        # Transcribe
        analyzer = AudioAnalyzer()
        audio_result = await analyzer.analyze(temp_path)
        transcript = audio_result.get("transcript", "")
        
        if not transcript:
            return {"error": "Could not transcribe audio"}
        
        # Get chatbot response
        result = get_chatbot_response(transcript)
        
        # Clean up
        import os
        os.remove(temp_path)
        
        return {
            "transcript": transcript,
            "response": result.get("response", ""),
            "voice_emotion": audio_result.get("voice_emotion", "neutral"),
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-multi")
async def analyze_with_multiple(request: ChatMessage):
    """Analyze text with multiple models for comparison"""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    results = analyze_with_multiple_models(request.message)
    
    if not results:
        raise HTTPException(status_code=503, detail="No AI models available")
    
    return {
        "text": request.message,
        "models_available": list(results.keys()),
        "results": results,
        "best_result": results[list(results.keys())[0]]  # Return first available
    }


@router.get("/health")
async def chatbot_health():
    """Check chatbot service health"""
    return {
        "status": "operational",
        "service": "chatbot_ai"
    }
