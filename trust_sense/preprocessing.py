"""
Multimodal Preprocessing Module
Handles text, image, video, audio preprocessing for trust analysis
"""

import cv2
import numpy as np
from PIL import Image
import speech_recognition as sr
from transformers import pipeline
import torch
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class Preprocessor:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.sentiment_analyzer = pipeline("sentiment-analysis", device=self.device)
        self.recognizer = sr.Recognizer()
        
    def process_text(self, text: str) -> Dict[str, Any]:
        """Process text for fake/real, propaganda, emotional influence analysis"""
        try:
            # Sentiment analysis
            sentiment = self.sentiment_analyzer(text)[0]
            
            # Basic text features
            features = {
                'length': len(text),
                'word_count': len(text.split()),
                'sentiment_score': sentiment['score'],
                'sentiment_label': sentiment['label'],
                'uppercase_ratio': sum(1 for c in text if c.isupper()) / len(text) if text else 0,
                'exclamation_count': text.count('!'),
                'question_count': text.count('?')
            }
            
            return {
                'processed_text': text.lower(),
                'features': features,
                'modality': 'text'
            }
        except Exception as e:
            logger.error(f"Text processing error: {e}")
            return {'error': str(e)}
    
    def process_image(self, image_path: str) -> Dict[str, Any]:
        """Process image for manipulation detection, OCR, meme analysis"""
        try:
            image = Image.open(image_path)
            img_array = np.array(image)
            
            # Basic image features
            features = {
                'width': image.width,
                'height': image.height,
                'channels': len(image.getbands()),
                'format': image.format,
                'mode': image.mode
            }
            
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY) if len(img_array.shape) == 3 else img_array
            
            # Edge detection (basic manipulation indicator)
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges > 0) / edges.size
            
            features.update({
                'edge_density': edge_density,
                'mean_intensity': np.mean(gray),
                'std_intensity': np.std(gray)
            })
            
            return {
                'image_array': img_array,
                'features': features,
                'modality': 'image'
            }
        except Exception as e:
            logger.error(f"Image processing error: {e}")
            return {'error': str(e)}
    
    def process_video(self, video_path: str) -> Dict[str, Any]:
        """Process video for frame analysis, motion detection, facial recognition"""
        try:
            cap = cv2.VideoCapture(video_path)
            
            frames = []
            frame_count = 0
            
            while cap.isOpened() and frame_count < 30:  # Sample first 30 frames
                ret, frame = cap.read()
                if not ret:
                    break
                frames.append(frame)
                frame_count += 1
            
            cap.release()
            
            if frames:
                # Basic motion analysis
                motion_scores = []
                prev_frame = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
                
                for frame in frames[1:]:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    diff = cv2.absdiff(prev_frame, gray)
                    motion_scores.append(np.mean(diff))
                    prev_frame = gray
                
                features = {
                    'total_frames': len(frames),
                    'avg_motion': np.mean(motion_scores) if motion_scores else 0,
                    'max_motion': max(motion_scores) if motion_scores else 0,
                    'frame_width': frames[0].shape[1],
                    'frame_height': frames[0].shape[0]
                }
            else:
                features = {'error': 'No frames extracted'}
            
            return {
                'frames': frames,
                'features': features,
                'modality': 'video'
            }
        except Exception as e:
            logger.error(f"Video processing error: {e}")
            return {'error': str(e)}
    
    def process_audio(self, audio_path: str) -> Dict[str, Any]:
        """Process audio for speech-to-text, emotion, sentiment"""
        try:
            with sr.AudioFile(audio_path) as source:
                audio_data = self.recognizer.record(source)
                
            # Speech to text
            try:
                text = self.recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                text = ""
            except sr.RequestError:
                text = ""
            
            # Basic audio features (placeholder - would need librosa for full analysis)
            features = {
                'duration': len(audio_data.frame_data) / audio_data.sample_rate if hasattr(audio_data, 'sample_rate') else 0,
                'text_transcript': text,
                'has_speech': len(text) > 0
            }
            
            return {
                'audio_data': audio_data,
                'transcript': text,
                'features': features,
                'modality': 'audio'
            }
        except Exception as e:
            logger.error(f"Audio processing error: {e}")
            return {'error': str(e)}
    
    def process_multimodal(self, inputs: Dict[str, str]) -> Dict[str, Any]:
        """Process multiple modalities simultaneously"""
        results = {}
        
        if 'text' in inputs:
            results['text'] = self.process_text(inputs['text'])
        if 'image' in inputs:
            results['image'] = self.process_image(inputs['image'])
        if 'video' in inputs:
            results['video'] = self.process_video(inputs['video'])
        if 'audio' in inputs:
            results['audio'] = self.process_audio(inputs['audio'])
            
        return results