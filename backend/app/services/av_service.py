"""Audio/Video analysis service for Trust Sense."""

import json
import io
import base64
from typing import Optional, Dict, Any

# Lazy imports for heavy dependencies
try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    HAS_LIBROSA = False

try:
    import soundfile as sf
    HAS_SOUNDFILE = True
except ImportError:
    HAS_SOUNDFILE = False

from pathlib import Path


def extract_speech_transcript(audio_input) -> Dict[str, Any]:
    """Extract speech transcript from audio using Speech Recognition."""
    try:
        import speech_recognition as sr
        from pydub import AudioSegment
    except ImportError:
        return {
            "transcript": "",
            "confidence": 0.0,
            "success": False,
            "error": "speech_recognition and pydub required. Install optional audio modules.",
        }
    
    result = {
        "transcript": "",
        "confidence": 0.0,
        "success": True,
        "error": None,
    }
    
    try:
        recognizer = sr.Recognizer()
        
        # Handle different input formats
        if isinstance(audio_input, str):
            if audio_input.startswith("data:audio"):
                # Base64 encoded audio
                audio_data = base64.b64decode(audio_input.split(",")[1])
                audio_file = io.BytesIO(audio_data)
            else:
                # File path
                audio_file = audio_input
        else:
            audio_file = audio_input
        
        # Convert to WAV format if needed
        if isinstance(audio_file, str) and not audio_file.endswith(".wav"):
            sound = AudioSegment.from_file(audio_file)
            audio_file = io.BytesIO(sound.export(format="wav").read())
        
        # Recognize speech
        if isinstance(audio_file, io.BytesIO):
            audio_file.seek(0)
            with sr.AudioFile(audio_file) as source:
                audio_data = recognizer.record(source)
        else:
            with sr.AudioFile(audio_file) as source:
                audio_data = recognizer.record(source)
        
        transcript = recognizer.recognize_google(audio_data)
        result["transcript"] = transcript
        result["confidence"] = 0.95  # Google API doesn't always return confidence
        
    except sr.RequestError as e:
        result["success"] = False
        result["error"] = f"Speech Recognition API error: {e}"
    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
    
    return result


def detect_voice_emotion(audio_input) -> Dict[str, Any]:
    """Detect emotion from voice tone using audio analysis."""
    if not HAS_LIBROSA or not HAS_NUMPY:
        return {
            "emotion": "neutral",
            "confidence": 0.0,
            "emotion_scores": {},
            "pitch": 0.0,
            "energy": 0.0,
            "success": False,
            "error": "librosa and numpy required for voice emotion detection. Install optional audio modules.",
        }
    
    result = {
        "emotion": "neutral",
        "confidence": 0.0,
        "emotion_scores": {},
        "pitch": 0.0,
        "energy": 0.0,
        "success": True,
        "error": None,
    }
    
    try:
        # Load audio file
        if isinstance(audio_input, str):
            if audio_input.startswith("data:audio"):
                audio_data = base64.b64decode(audio_input.split(",")[1])
                audio_file = io.BytesIO(audio_data)
                y, sr_val = librosa.load(audio_file, sr=None)
            else:
                y, sr_val = librosa.load(audio_input, sr=None)
        else:
            y, sr_val = librosa.load(audio_input, sr=None)
        
        # Extract features
        # Mel-frequency cepstral coefficients
        mfcc = librosa.feature.mfcc(y=y, sr=sr_val, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        
        # Pitch estimation using autocorrelation
        S = np.abs(librosa.stft(y))
        chromagram = librosa.feature.chroma_stft(S=S, sr=sr_val)
        pitch_mean = np.mean(chromagram)
        
        # Energy
        energy = np.mean(librosa.feature.melspectrogram(y=y, sr=sr_val))
        
        # Zero crossing rate (indicates speech clarity)
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        
        # Simple emotion classification based on acoustic features
        normalized_energy = (energy - 20) / 60  # Normalize
        normalized_pitch = pitch_mean / np.max(chromagram) if np.max(chromagram) > 0 else 0.5
        
        emotion_scores = {
            "joy": min(1.0, max(0, normalized_energy * 1.2 + normalized_pitch * 0.8)),
            "sadness": min(1.0, max(0, (1 - normalized_energy) * 0.9)),
            "anger": min(1.0, abs(np.std(mfcc_mean) / 100) * 0.8),
            "neutral": min(1.0, 1 - abs(normalized_energy - 0.5) * 0.6),
            "fear": min(1.0, zcr * 0.5),
        }
        
        # Normalize scores
        total = sum(emotion_scores.values())
        if total > 0:
            emotion_scores = {k: v / total for k, v in emotion_scores.items()}
        
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        
        result["emotion"] = dominant_emotion
        result["confidence"] = emotion_scores[dominant_emotion]
        result["emotion_scores"] = emotion_scores
        result["pitch"] = float(pitch_mean)
        result["energy"] = float(energy)
        
    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
    
    return result


def detect_deepfake_video(video_input) -> Dict[str, Any]:
    """Detect deepfake manipulation in video using face consistency analysis."""
    if not HAS_CV2 or not HAS_NUMPY:
        return {
            "is_deepfake_probability": 0.0,
            "frames_analyzed": 0,
            "face_consistency": 0.0,
            "success": False,
            "error": "OpenCV and numpy required for video analysis. Install optional video modules.",
            "details": {}
        }
    
    result = {
        "is_deepfake_probability": 0.0,
        "frames_analyzed": 0,
        "face_consistency": 0.0,
        "success": True,
        "error": None,
        "details": {}
    }
    
    try:
        try:
            from deepface import DeepFace
        except ImportError:
            result["error"] = "deepface library not installed. Install optional deepfake detection module."
            result["success"] = False
            return result
        
        # Open video file
        if isinstance(video_input, str):
            cap = cv2.VideoCapture(video_input)
        else:
            cap = video_input
        
        frame_count = 0
        face_embeddings = []
        max_frames = 30  # Analyze first 30 frames
        
        while frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            try:
                # Extract face embedding
                embeddings = DeepFace.represent(frame, model_name="Facenet512", enforce_detection=False)
                if embeddings:
                    face_embeddings.append(embeddings[0]["embedding"])
                    frame_count += 1
            except:
                # Skip frames where face detection fails
                continue
        
        cap.release()
        
        if len(face_embeddings) < 2:
            result["error"] = "Could not extract enough face frames"
            result["success"] = False
            return result
        
        # Calculate consistency between frames
        embeddings_array = np.array(face_embeddings)
        embedding_std = np.std(embeddings_array, axis=0)
        avg_std = np.mean(embedding_std)
        
        deepfake_score = min(1.0, avg_std / 0.15)
        
        result["is_deepfake_probability"] = float(deepfake_score)
        result["frames_analyzed"] = frame_count
        result["face_consistency"] = float(1 - deepfake_score)
        result["details"] = {
            "embedding_variance": float(avg_std),
            "threshold": 0.15,
            "interpretation": "High face consistency" if deepfake_score < 0.3 else "Medium consistency" if deepfake_score < 0.6 else "Low consistency (potential deepfake)"
        }
        
    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
    
    return result


def analyze_facial_emotions(video_input) -> Dict[str, Any]:
    """Analyze facial emotions in video frames."""
    if not HAS_CV2 or not HAS_NUMPY:
        return {
            "frames_analyzed": 0,
            "dominant_emotions": [],
            "emotion_timeline": [],
            "average_emotions": {},
            "success": False,
            "error": "OpenCV and numpy required for video analysis. Install optional video modules.",
        }
    
    result = {
        "frames_analyzed": 0,
        "dominant_emotions": [],
        "emotion_timeline": [],
        "average_emotions": {},
        "success": True,
        "error": None,
    }
    
    try:
        try:
            from deepface import DeepFace
        except ImportError:
            result["error"] = "deepface library not installed. Install optional facial emotion detection module."
            result["success"] = False
            return result
        
        # Open video file
        if isinstance(video_input, str):
            cap = cv2.VideoCapture(video_input)
        else:
            cap = video_input
        
        frame_count = 0
        all_emotions = {}
        max_frames = 60  # Analyze first 60 frames
        
        while frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            try:
                # Analyze faces in frame
                analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
                
                if analysis:
                    for face_analysis in analysis:
                        emotions = face_analysis.get('emotion', {})
                        dominant = face_analysis.get('dominant_emotion', 'unknown')
                        
                        result["dominant_emotions"].append(dominant)
                        result["emotion_timeline"].append({
                            "frame": frame_count,
                            "emotion": dominant,
                            "scores": emotions
                        })
                        
                        # Accumulate emotion scores
                        for emotion, score in emotions.items():
                            if emotion not in all_emotions:
                                all_emotions[emotion] = []
                            all_emotions[emotion].append(score)
                
                frame_count += 1
            except:
                # Skip frames where analysis fails
                continue
        
        cap.release()
        
        # Calculate averages
        for emotion, scores in all_emotions.items():
            result["average_emotions"][emotion] = float(np.mean(scores))
        
        result["frames_analyzed"] = frame_count
        
    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
    
    return result


def integrated_av_analysis(audio_path: Optional[str] = None, video_path: Optional[str] = None) -> Dict[str, Any]:
    """Integrated audio-video analysis combining all detection methods."""
    result = {
        "audio_analysis": {},
        "video_analysis": {},
        "combined_score": 0.0,
        "risk_assessment": "LOW",
    }
    
    if audio_path:
        transcript = extract_speech_transcript(audio_path)
        voice_emotion = detect_voice_emotion(audio_path)
        result["audio_analysis"] = {
            "transcript": transcript,
            "voice_emotion": voice_emotion
        }
    
    if video_path:
        deepfake_result = detect_deepfake_video(video_path)
        facial_emotions = analyze_facial_emotions(video_path)
        result["video_analysis"] = {
            "deepfake_detection": deepfake_result,
            "facial_emotions": facial_emotions
        }
    
    # Combine scores - handle missing numpy gracefully
    scores = []
    if audio_path and result["audio_analysis"].get("voice_emotion", {}).get("confidence"):
        scores.append(result["audio_analysis"]["voice_emotion"]["confidence"])
    if video_path and result["video_analysis"].get("deepfake_detection", {}).get("is_deepfake_probability") is not None:
        scores.append(result["video_analysis"]["deepfake_detection"]["is_deepfake_probability"])
    
    if scores and HAS_NUMPY:
        result["combined_score"] = float(np.mean(scores))
        result["risk_assessment"] = "CRITICAL" if result["combined_score"] > 0.8 else "HIGH" if result["combined_score"] > 0.6 else "MEDIUM" if result["combined_score"] > 0.3 else "LOW"
    
    return result
