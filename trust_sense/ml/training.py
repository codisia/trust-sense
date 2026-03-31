"""
Training Module for Multimodal Trust Models
Handles training, validation, and hyperparameter tuning
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from typing import Dict, Any, Optional, List
import logging
import json
import os

logger = logging.getLogger(__name__)

class MultimodalDataset(Dataset):
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        return self.data[idx]

class Trainer:
    def __init__(self, model: nn.Module, device: str = "auto"):
        self.model = model
        self.device = torch.device(device if device != "auto" else ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model.to(self.device)
        
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.AdamW(self.model.parameters(), lr=2e-5, weight_decay=0.01)
        self.scheduler = optim.lr_scheduler.StepLR(self.optimizer, step_size=1, gamma=0.95)
        
    def train_epoch(self, dataloader: DataLoader) -> Dict[str, float]:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for batch in dataloader:
            self.optimizer.zero_grad()
            
            # Prepare inputs (simplified - would need proper tokenization)
            inputs = self._prepare_batch_inputs(batch)
            labels = batch['labels'].to(self.device)
            
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels)
            
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
        
        return {
            'loss': total_loss / len(dataloader),
            'accuracy': correct / total
        }
    
    def validate(self, dataloader: DataLoader) -> Dict[str, float]:
        """Validate model"""
        self.model.eval()
        total_loss = 0
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for batch in dataloader:
                inputs = self._prepare_batch_inputs(batch)
                labels = batch['labels'].to(self.device)
                
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)
                
                total_loss += loss.item()
                _, predicted = outputs.max(1)
                
                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        return {
            'loss': total_loss / len(dataloader),
            'accuracy': accuracy_score(all_labels, all_preds),
            'f1': f1_score(all_labels, all_preds, average='weighted'),
            'precision': precision_score(all_labels, all_preds, average='weighted'),
            'recall': recall_score(all_labels, all_preds, average='weighted')
        }
    
    def train(self, train_loader: DataLoader, val_loader: DataLoader, 
              num_epochs: int = 10, patience: int = 3) -> Dict[str, Any]:
        """Full training loop with early stopping"""
        best_val_loss = float('inf')
        patience_counter = 0
        best_model_state = None
        
        history = {
            'train_loss': [],
            'train_acc': [],
            'val_loss': [],
            'val_acc': [],
            'val_f1': []
        }
        
        for epoch in range(num_epochs):
            logger.info(f"Epoch {epoch + 1}/{num_epochs}")
            
            # Train
            train_metrics = self.train_epoch(train_loader)
            logger.info(f"Train - Loss: {train_metrics['loss']:.4f}, Acc: {train_metrics['accuracy']:.4f}")
            
            # Validate
            val_metrics = self.validate(val_loader)
            logger.info(f"Val - Loss: {val_metrics['loss']:.4f}, Acc: {val_metrics['accuracy']:.4f}, F1: {val_metrics['f1']:.4f}")
            
            # Record history
            history['train_loss'].append(train_metrics['loss'])
            history['train_acc'].append(train_metrics['accuracy'])
            history['val_loss'].append(val_metrics['loss'])
            history['val_acc'].append(val_metrics['accuracy'])
            history['val_f1'].append(val_metrics['f1'])
            
            # Early stopping
            if val_metrics['loss'] < best_val_loss:
                best_val_loss = val_metrics['loss']
                patience_counter = 0
                best_model_state = self.model.state_dict().copy()
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    logger.info("Early stopping triggered")
                    break
            
            self.scheduler.step()
        
        # Load best model
        if best_model_state:
            self.model.load_state_dict(best_model_state)
        
        return history
    
    def _prepare_batch_inputs(self, batch: Dict[str, Any]) -> Dict[str, torch.Tensor]:
        """Prepare batch inputs for model (simplified)"""
        inputs = {'batch_size': len(batch['text'])}
        
        # Text inputs (would need proper tokenization)
        if 'text' in batch:
            # Placeholder - in real implementation, use tokenizer
            inputs['text'] = {
                'input_ids': torch.tensor(batch['text_input_ids']).to(self.device),
                'attention_mask': torch.tensor(batch['text_attention_mask']).to(self.device)
            }
        
        # Similar for image, audio, video
        if 'image' in batch:
            inputs['image'] = {
                'pixel_values': torch.tensor(batch['image_pixel_values']).to(self.device)
            }
        
        if 'audio' in batch:
            inputs['audio'] = {
                'input_values': torch.tensor(batch['audio_input_values']).to(self.device)
            }
        
        if 'video' in batch:
            inputs['video'] = torch.tensor(batch['video_frames']).to(self.device)
        
        return inputs
    
    def save_checkpoint(self, path: str, epoch: int, metrics: Dict[str, float]):
        """Save training checkpoint"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'metrics': metrics
        }
        torch.save(checkpoint, path)
    
    def load_checkpoint(self, path: str):
        """Load training checkpoint"""
        checkpoint = torch.load(path)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        return checkpoint['epoch'], checkpoint['metrics']