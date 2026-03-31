"""
Audio and Video Analyzers
Handles extraction and analysis of audio/video content
"""

import os
import re
import asyncio
from typing import Dict, Any, Optional
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    librosa = None
    LIBROSA_AVAILABLE = False
try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    pipeline = None
    TRANSFORMERS_AVAILABLE = False
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    cv2 = None
    CV2_AVAILABLE = False
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    face_recognition = None
    FACE_RECOGNITION_AVAILABLE = False
try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    pytesseract = None
    PYTESSERACT_AVAILABLE = False
try:
    from moviepy.editor import VideoFileClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    VideoFileClip = None
    MOVIEPY_AVAILABLE = False

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False


class AudioAnalyzer:
    """
    Analyzes audio content including:
    - Speech to text transcription
    - Voice emotion detection
    - Speaker identification
    - Audio quality assessment
    """
    
    def __init__(self):
        self.supported_formats = [".wav", ".mp3", ".m4a", ".ogg", ".flac"]
        # Load Whisper model (base model for speed) if available
        if WHISPER_AVAILABLE:
            self.whisper_model = whisper.load_model("base")
        else:
            self.whisper_model = None
        # Load voice emotion recognition pipeline if available
        if TRANSFORMERS_AVAILABLE:
            self.emotion_pipeline = pipeline("audio-classification", model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition")
        else:
            self.emotion_pipeline = None
    
    async def analyze(self, audio_path: str) -> Dict[str, Any]:
        """
        Analyze audio file
        
        In production would use: 
        - Speech Recognition API (Google Cloud, Azure, AWS)
        - Voice emotion detection (various ML models)
        - Speaker diarization
        """
        
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        # Validate format
        ext = os.path.splitext(audio_path)[1].lower()
        if ext not in self.supported_formats:
            raise ValueError(f"Unsupported audio format: {ext}")
        
        # Get audio duration
        if LIBROSA_AVAILABLE:
            try:
                y, sr = librosa.load(audio_path, sr=None)
                duration = len(y) / sr
            except:
                duration = 0
        else:
            duration = 0
        
        transcript = await self._transcribe_audio(audio_path)
        voice_emotion = await self._detect_voice_emotion(audio_path)
        
        # Placeholder analysis (in production would use real APIs)
        return {
            "transcript": transcript,
            "voice_emotion": voice_emotion,
            "voice_emotion_score": 0.72,
            "speaks_clearly": True,
            "audio_quality": "good",
            "duration_seconds": duration,
            "speakers_detected": 1,
            "speech_rate": "normal",
            "accent_detected": "standard",
            "background_noise": "low",
            "sentiment": 50,
            "credibility": 60,
            "fake_news_probability": 0,
            "manipulation_score": 0,
            "linguistic_neutrality": 55,
            "content_reliability": 60,
            "emotional_stability": 75,
            "dominant_emotion": voice_emotion,
            "emotions": {
                "joy": 0,
                "sadness": 0,
                "anger": 0,
                "fear": 0,
                "surprise": 0,
                "disgust": 0
            },
            "signals": {},
        }
    
    async def _transcribe_audio(self, audio_path: str) -> str:
        """
        Transcribe audio to text using OpenAI Whisper if available
        """
        if not WHISPER_AVAILABLE or self.whisper_model is None:
            return "[Whisper not installed - transcription unavailable]"
        try:
            # Run Whisper transcription in thread to not block async
            result = await asyncio.to_thread(self.whisper_model.transcribe, audio_path)
            return result["text"].strip()
        except Exception as e:
            return f"[Transcription failed: {str(e)}]"
    
    async def _detect_voice_emotion(self, audio_path: str) -> str:
        """
        Detect emotion from voice using wav2vec2 model if available
        """
        if not TRANSFORMERS_AVAILABLE or self.emotion_pipeline is None:
            return "neutral"
        try:
            # Classify emotion
            predictions = await asyncio.to_thread(self.emotion_pipeline, audio_path)
            if predictions:
                return predictions[0]["label"]
            return "neutral"
        except Exception as e:
            return "neutral"


class VideoAnalyzer:
    """
    Analyzes video content including:
    - Frame extraction and analysis
    - Facial emotion detection
    - Deepfake detection
    - Speech transcription
    - Scene analysis
    """
    
    def __init__(self):
        self.supported_formats = [".mp4", ".avi", ".mov", ".mkv", ".flv"]
        # Load facial emotion recognition pipeline if available
        if TRANSFORMERS_AVAILABLE:
            self.facial_emotion_pipeline = pipeline("image-classification", model="trpakov/vit-face-expression")
        else:
            self.facial_emotion_pipeline = None
        # Whisper for speech if available
        if WHISPER_AVAILABLE:
            self.whisper_model = whisper.load_model("base")
        else:
            self.whisper_model = None
    
    async def analyze(self, video_path: str) -> Dict[str, Any]:
        """
        Analyze video file
        
        In production would use:
        - OpenCV for frame extraction
        - Face detection (dlib, mediapipe)
        - Emotion recognition (emotion APIs)
        - Speech-to-text on audio track
        - Deepfake detection models
        """
        
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        # Validate format
        ext = os.path.splitext(video_path)[1].lower()
        if ext not in self.supported_formats:
            raise ValueError(f"Unsupported video format: {ext}")
        
        # Get video properties
        if CV2_AVAILABLE:
            video_cap = cv2.VideoCapture(video_path)
            fps = video_cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(video_cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            width = int(video_cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(video_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            resolution = f"{width}x{height}"
            video_cap.release()
        else:
            duration = 0
            fps = 30
            resolution = "unknown"
            frame_count = 0
        
        # Extract transcript
        transcript = await self._extract_speech(video_path)
        
        # Detect faces in middle frame
        face_count = 0
        if CV2_AVAILABLE and FACE_RECOGNITION_AVAILABLE:
            video_cap = cv2.VideoCapture(video_path)
            middle_frame = frame_count // 2
            video_cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
            ret, frame = video_cap.read()
            video_cap.release()
            
            if ret:
                face_locations = face_recognition.face_locations(frame)
                face_count = len(face_locations)
        
        facial_emotions = await self._detect_facial_emotions(video_path)
        text_on_screen = await self._extract_text_from_frames(video_path)
        
        # Placeholder for deepfake (in production use real model)
        deepfake_probability = 0.05  # Low for MVP
        
        # Placeholder analysis
        return {
            "transcript": transcript,
            "duration_seconds": duration,
            "fps": fps,
            "resolution": resolution,
            "has_faces": face_count > 0,
            "face_count": face_count,
            "facial_emotions": facial_emotions,
            "deepfake_probability": deepfake_probability,
            "deepfake_confidence": "low" if deepfake_probability < 0.3 else "medium",
            "faces_detected": face_count,
            "eye_contact": "maintained",
            "facial_expressions": list(facial_emotions.keys())[:2],
            "head_movements": "natural",
            "hand_gestures": "present",
            "gesture_frequency": "moderate",
            "text_on_screen": text_on_screen,
            "scene_changes": 5,
            "video_quality": "good",
            "lighting_quality": "good",
            "background_changes": 2,
            # Text analysis of transcript
            "sentiment": 50,
            "credibility": 60,
            "fake_news_probability": 0,
            "manipulation_score": 0,
            "linguistic_neutrality": 55,
            "content_reliability": 60,
            "emotional_stability": 75,
            "dominant_emotion": max(facial_emotions, key=facial_emotions.get) if facial_emotions else "neutral",
            "emotions": facial_emotions,
            "signals": {},
            "voice_emotion": "neutral",
            "voice_emotion_score": 0.65,
        }
    
    async def _extract_speech(self, video_path: str) -> str:
        """
        Extract and transcribe speech from video
        """
        if not WHISPER_AVAILABLE or self.whisper_model is None or not MOVIEPY_AVAILABLE:
            return "[Whisper or MoviePy not installed - speech extraction unavailable]"
        try:
            # Extract audio from video
            video = VideoFileClip(video_path)
            audio_path = video_path + "_temp_audio.wav"
            video.audio.write_audiofile(audio_path, verbose=False, logger=None)
            video.close()
            
            # Transcribe
            result = await asyncio.to_thread(self.whisper_model.transcribe, audio_path)
            transcript = result["text"].strip()
            
            # Clean up
            os.remove(audio_path)
            return transcript
        except Exception as e:
            return f"[Speech extraction failed: {str(e)}]"
    
    async def _detect_facial_emotions(self, video_path: str) -> Dict[str, float]:
        """
        Detect facial expressions throughout video
        """
        if not CV2_AVAILABLE or not FACE_RECOGNITION_AVAILABLE or not TRANSFORMERS_AVAILABLE or self.facial_emotion_pipeline is None:
            return {"neutral": 1.0}
        try:
            # Extract middle frame
            video = cv2.VideoCapture(video_path)
            total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
            middle_frame = total_frames // 2
            video.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
            ret, frame = video.read()
            video.release()
            
            if not ret:
                return {"neutral": 1.0}
            
            # Detect faces
            face_locations = face_recognition.face_locations(frame)
            if not face_locations:
                return {"neutral": 1.0}
            
            # Use first face
            top, right, bottom, left = face_locations[0]
            face_image = frame[top:bottom, left:right]
            
            # Convert to RGB for pipeline
            face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # Classify emotion
            predictions = await asyncio.to_thread(self.facial_emotion_pipeline, face_rgb)
            
            # Convert to dict
            emotions = {pred["label"]: pred["score"] for pred in predictions}
            return emotions
        except Exception as e:
            return {"neutral": 1.0}
    
    async def _extract_text_from_frames(self, video_path: str) -> Optional[str]:
        """
        Extract text visible in video frames (OCR)
        """
        if not CV2_AVAILABLE or not PYTESSERACT_AVAILABLE:
            return None
        try:
            # Extract middle frame
            video = cv2.VideoCapture(video_path)
            total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
            middle_frame = total_frames // 2
            video.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
            ret, frame = video.read()
            video.release()
            
            if not ret:
                return None
            
            # Convert to grayscale for OCR
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # OCR
            if PYTESSERACT_AVAILABLE:
                text = await asyncio.to_thread(pytesseract.image_to_string, gray)
                return text.strip() if text.strip() else None
            else:
                return None
        except Exception as e:
            return None
