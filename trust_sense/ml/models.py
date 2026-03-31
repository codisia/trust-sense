"""
Multimodal ML Models for Trust Analysis
Combines text, image, video, audio features for trust prediction
"""

import torch
import torch.nn as nn
from transformers import BertModel, ViTModel, Wav2Vec2Model
import numpy as np
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class MultimodalModel(nn.Module):
    def __init__(self, 
                 text_model_name: str = "bert-base-uncased",
                 image_model_name: str = "google/vit-base-patch16-224",
                 audio_model_name: str = "facebook/wav2vec2-base-960h",
                 hidden_dim: int = 768,
                 num_classes: int = 2):
        super().__init__()
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Text model
        self.text_model = BertModel.from_pretrained(text_model_name)
        self.text_projection = nn.Linear(768, hidden_dim)
        
        # Image model
        self.image_model = ViTModel.from_pretrained(image_model_name)
        self.image_projection = nn.Linear(768, hidden_dim)
        
        # Audio model (simplified - wav2vec for speech)
        self.audio_model = Wav2Vec2Model.from_pretrained(audio_model_name)
        self.audio_projection = nn.Linear(768, hidden_dim)
        
        # Video processing (simplified - treat as sequence of images)
        self.video_projection = nn.Linear(hidden_dim, hidden_dim)
        
        # Fusion layers
        self.fusion = nn.MultiheadAttention(hidden_dim, num_heads=8, batch_first=True)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * 4, hidden_dim),  # 4 modalities
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, num_classes)
        )
        
        self.to(self.device)
    
    def forward(self, inputs: Dict[str, torch.Tensor]) -> torch.Tensor:
        """Forward pass through multimodal model"""
        embeddings = []
        
        # Text processing
        if 'text' in inputs:
            text_outputs = self.text_model(**inputs['text'])
            text_emb = self.text_projection(text_outputs.pooler_output)
            embeddings.append(text_emb)
        else:
            embeddings.append(torch.zeros(inputs['batch_size'], 768, device=self.device))
        
        # Image processing
        if 'image' in inputs:
            image_outputs = self.image_model(**inputs['image'])
            image_emb = self.image_projection(image_outputs.pooler_output)
            embeddings.append(image_emb)
        else:
            embeddings.append(torch.zeros(inputs['batch_size'], 768, device=self.device))
        
        # Audio processing
        if 'audio' in inputs:
            audio_outputs = self.audio_model(**inputs['audio'])
            audio_emb = self.audio_projection(audio_outputs.last_hidden_state.mean(dim=1))
            embeddings.append(audio_emb)
        else:
            embeddings.append(torch.zeros(inputs['batch_size'], 768, device=self.device))
        
        # Video processing (simplified)
        if 'video' in inputs:
            # Average frame embeddings
            video_emb = inputs['video'].mean(dim=1)  # [batch, seq_len, hidden] -> [batch, hidden]
            video_emb = self.video_projection(video_emb)
            embeddings.append(video_emb)
        else:
            embeddings.append(torch.zeros(inputs['batch_size'], 768, device=self.device))
        
        # Stack embeddings
        stacked_emb = torch.stack(embeddings, dim=1)  # [batch, 4, hidden]
        
        # Self-attention fusion
        fused_emb, _ = self.fusion(stacked_emb, stacked_emb, stacked_emb)
        fused_emb = fused_emb.mean(dim=1)  # [batch, hidden]
        
        # Classification
        logits = self.classifier(fused_emb)
        return logits
    
    def predict_trust_score(self, inputs: Dict[str, torch.Tensor]) -> torch.Tensor:
        """Predict trust score (0-1)"""
        logits = self.forward(inputs)
        probs = torch.softmax(logits, dim=-1)
        return probs[:, 1]  # Probability of trustworthy
    
    def save_model(self, path: str):
        """Save model state"""
        torch.save(self.state_dict(), path)
    
    def load_model(self, path: str):
        """Load model state"""
        self.load_state_dict(torch.load(path))
        self.eval()