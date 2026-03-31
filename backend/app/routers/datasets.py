"""
Dataset Management Router
Handles storage, management, and retrieval of annotated datasets
Used for training and evaluation of AI models
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.models import User
from app.services.huggingface_datasets import (
    HuggingFaceDatasets,
    FakeNewsAnalyzer,
    PsychologyAnalyzerHF
)

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])


# Domain-specific dataset schemas
class DatasetMetadata:
    """Metadata for annotated datasets"""
    
    DOMAINS = {
        "psychology": {
            "description": "Psychological analysis datasets",
            "traits": ["emotional_stability", "cognitive_bias", "aggression"],
            "model": "psychological_influence_index"
        },
        "health": {
            "description": "Health misinformation detection",
            "traits": ["health_misinformation", "credibility", "evidence_quality"],
            "model": "health_reliability_scorer"
        },
        "military": {
            "description": "Military/strategic content analysis",
            "traits": ["disinformation", "propaganda", "strategic_messaging"],
            "model": "military_disinformation_detector"
        },
        "education": {
            "description": "Educational content quality",
            "traits": ["educational_quality", "source_credibility", "bias"],
            "model": "education_quality_scorer"
        },
        "transport": {
            "description": "Transportation & safety content",
            "traits": ["safety_accuracy", "regulatory_compliance"],
            "model": "transport_safety_analyzer"
        }
    }


@router.post("/upload/{domain}")
async def upload_dataset(
    domain: str,
    file: UploadFile = File(...),
    description: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_admin)
) -> Dict[str, Any]:
    """
    Upload annotated dataset for specific domain
    File format: JSON Lines (one annotation per line)
    
    Expected format per line:
    {
        "text": "content to analyze",
        "domain": "psychology",
        "label": "acceptable|suspicious|high_risk",
        "annotations": {
            "emotion": "anger",
            "trust_score": 45,
            "manipulation_score": 75,
            "confidence": 0.92
        },
        "expert_notes": "optional notes"
    }
    """
    
    if domain not in DatasetMetadata.DOMAINS:
        raise HTTPException(status_code=400, detail=f"Unknown domain: {domain}")
    
    try:
        contents = await file.read()
        lines = contents.decode('utf-8').split('\n')
        
        # Validate JSONL format
        records = []
        errors = []
        for idx, line in enumerate(lines):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
                records.append(record)
            except json.JSONDecodeError as e:
                errors.append(f"Line {idx}: {str(e)}")
        
        if errors:
            raise HTTPException(status_code=400, detail={"validation_errors": errors})
        
        # In production, save to database or cloud storage
        dataset_id = f"{domain}_{datetime.utcnow().timestamp()}"
        
        return {
            "status": "success",
            "dataset_id": dataset_id,
            "domain": domain,
            "record_count": len(records),
            "uploaded_by": current_user.username,
            "timestamp": datetime.utcnow().isoformat(),
            "description": description or f"Dataset for {domain} domain",
            "info": DatasetMetadata.DOMAINS[domain]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_datasets(
    domain: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    List available datasets
    Filter by domain (optional)
    """
    
    # In production, fetch from database
    datasets = {
        "psychology": {
            "available_datasets": [
                {
                    "id": "psych_001",
                    "name": "Big Five Dataset",
                    "records": 5000,
                    "traits": ["emotional_stability", "cognitive_bias"],
                    "created": "2026-01-15",
                    "last_updated": "2026-02-20"
                },
                {
                    "id": "psych_002",
                    "name": "Persuasion Techniques Dataset",
                    "records": 3500,
                    "traits": ["manipulation_score", "aggression"],
                    "created": "2026-02-01",
                    "last_updated": "2026-02-25"
                }
            ]
        },
        "health": {
            "available_datasets": [
                {
                    "id": "health_001",
                    "name": "Medical Misinformation Dataset",
                    "records": 8000,
                    "traits": ["credibility", "evidence_quality"],
                    "created": "2026-01-10",
                    "last_updated": "2026-02-20"
                }
            ]
        },
        "military": {
            "available_datasets": [
                {
                    "id": "mil_001",
                    "name": "Propaganda Detection Dataset",
                    "records": 4000,
                    "traits": ["disinformation", "strategic_messaging"],
                    "created": "2026-01-20",
                    "last_updated": "2026-02-15"
                }
            ]
        },
        "education": {
            "available_datasets": [
                {
                    "id": "edu_001",
                    "name": "Educational Quality Dataset",
                    "records": 6000,
                    "traits": ["source_credibility", "bias"],
                    "created": "2026-01-25",
                    "last_updated": "2026-02-18"
                }
            ]
        },
        "transport": {
            "available_datasets": [
                {
                    "id": "trans_001",
                    "name": "Safety Compliance Dataset",
                    "records": 2000,
                    "traits": ["safety_accuracy", "regulatory_compliance"],
                    "created": "2026-02-01",
                    "last_updated": "2026-02-25"
                }
            ]
        }
    }
    
    if domain:
        if domain not in datasets:
            raise HTTPException(status_code=400, detail=f"Unknown domain: {domain}")
        return {
            "domain": domain,
            "datasets": datasets[domain]["available_datasets"],
            "metadata": DatasetMetadata.DOMAINS[domain]
        }
    
    # Return summary of all domains
    return {
        "status": "success",
        "domains": DatasetMetadata.DOMAINS,
        "total_datasets": sum(len(v["available_datasets"]) for v in datasets.values()),
        "domains_data": datasets
    }


@router.get("/{dataset_id}/info")
async def get_dataset_info(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get detailed information about a dataset
    """
    
    # Placeholder: In production, fetch from database
    return {
        "dataset_id": dataset_id,
        "name": "Example Dataset",
        "domain": "psychology",
        "description": "A sample dataset for psychological analysis",
        "statistics": {
            "total_records": 5000,
            "languages": ["english"],
            "date_range": {
                "start": "2024-01-01",
                "end": "2026-02-28"
            }
        },
        "annotations": {
            "emotion": ["fear", "anger", "joy", "sadness", "surprise", "disgust"],
            "trust_score": "0-100",
            "manipulation_score": "0-100",
            "labels": ["safe", "suspicious", "high_risk"]
        },
        "model_performance": {
            "accuracy": 0.87,
            "precision": 0.89,
            "recall": 0.85,
            "f1_score": 0.87
        },
        "last_trained": "2026-02-25T10:30:00Z",
        "next_training": "2026-03-05T10:30:00Z"
    }


@router.get("/{dataset_id}/samples")
async def get_dataset_samples(
    dataset_id: str,
    limit: int = Query(10, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get sample records from dataset
    Useful for understanding dataset structure and quality
    """
    
    # Placeholder samples
    samples = [
        {
            "id": f"{dataset_id}_sample_1",
            "text": "This is a psychological analysis sample text",
            "annotations": {
                "emotion": "neutral",
                "trust_score": 72,
                "manipulation_score": 25,
                "aggression_score": 10,
                "label": "safe"
            },
            "expert_confidence": 0.92
        },
        {
            "id": f"{dataset_id}_sample_2",
            "text": "Another example showing concerning psychological patterns",
            "annotations": {
                "emotion": "anger",
                "trust_score": 35,
                "manipulation_score": 78,
                "aggression_score": 65,
                "label": "high_risk"
            },
            "expert_confidence": 0.95
        }
    ]
    
    return {
        "dataset_id": dataset_id,
        "total_available": 5000,
        "offset": offset,
        "limit": limit,
        "samples": samples[:limit],
        "has_more": offset + limit < 5000
    }


@router.post("/{dataset_id}/retrain")
async def retrain_model_with_dataset(
    dataset_id: str,
    test_split: float = Query(0.2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_admin)
) -> Dict[str, Any]:
    """
    Trigger model retraining using dataset
    Requires admin role
    """
    
    if not 0 < test_split < 1:
        raise HTTPException(status_code=400, detail="test_split must be between 0 and 1")
    
    # Placeholder: In production, would queue training job
    return {
        "status": "training_queued",
        "dataset_id": dataset_id,
        "job_id": f"train_job_{datetime.utcnow().timestamp()}",
        "test_split": test_split,
        "estimated_duration_minutes": 45,
        "notification_email": current_user.email,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/{dataset_id}/training-status")
async def get_training_status(
    dataset_id: str,
    job_id: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get status of model training job
    """
    
    # Placeholder
    return {
        "dataset_id": dataset_id,
        "job_id": job_id,
        "status": "completed",
        "progress": 100,
        "results": {
            "accuracy": 0.89,
            "precision": 0.91,
            "recall": 0.87,
            "f1_score": 0.89,
            "improvement_vs_baseline": "+3.2%"
        },
        "completed_at": datetime.utcnow().isoformat()
    }


# ========== HUGGINGFACE DATASETS ENDPOINTS ==========

@router.get("/huggingface/fake-news")
async def get_huggingface_fake_news_datasets() -> Dict[str, Any]:
    """Get all fake news detection datasets from HuggingFace Hub"""
    return {
        "datasets": HuggingFaceDatasets.get_fake_news_datasets(),
        "models": HuggingFaceDatasets.get_fake_news_models(),
        "description": "Datasets and models for detecting fake news, misinformation, and rumor detection"
    }


@router.get("/huggingface/psychology")
async def get_huggingface_psychology_datasets() -> Dict[str, Any]:
    """Get all psychology and emotion analysis datasets from HuggingFace Hub"""
    return {
        "datasets": HuggingFaceDatasets.get_psychology_datasets(),
        "models": HuggingFaceDatasets.get_psychology_models(),
        "description": "Datasets and models for psychology analysis, emotion detection, and mental health indicators"
    }


@router.get("/huggingface/all")
async def get_all_huggingface_resources() -> Dict[str, Any]:
    """Get ALL HuggingFace datasets and recommended models"""
    return {
        "fake_news_datasets": HuggingFaceDatasets.get_fake_news_datasets(),
        "psychology_datasets": HuggingFaceDatasets.get_psychology_datasets(),
        "fake_news_models": HuggingFaceDatasets.get_fake_news_models(),
        "psychology_models": HuggingFaceDatasets.get_psychology_models(),
        "total_datasets": 7,
        "total_models": 7
    }


@router.post("/huggingface/analyze-fake-news")
async def analyze_with_fake_news_datasets(request: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze text using fake news detection insights from HuggingFace datasets"""
    try:
        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text parameter required")
        result = FakeNewsAnalyzer.analyze_with_datasets(text)
        return {
            "success": True,
            "analysis": result,
            "message": "Analysis using HuggingFace dataset insights"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/huggingface/analyze-psychology")
async def analyze_with_psychology_datasets(request: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze text using psychology and emotion detection from HuggingFace datasets"""
    try:
        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text parameter required")
        psych_result = PsychologyAnalyzerHF.analyze_psychological_state(text)
        mental_health_result = PsychologyAnalyzerHF.detect_mental_health_indicators(text)
        
        return {
            "success": True,
            "psychological_analysis": psych_result,
            "mental_health_indicators": mental_health_result,
            "message": "Analysis using HuggingFace dataset insights"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/huggingface/analyze-comprehensive")
async def comprehensive_huggingface_analysis(request: Dict[str, Any]) -> Dict[str, Any]:
    """Comprehensive analysis combining ALL HuggingFace datasets"""
    try:
        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text parameter required")
        fake_news_result = FakeNewsAnalyzer.analyze_with_datasets(text)
        psych_result = PsychologyAnalyzerHF.analyze_psychological_state(text)
        mental_health_result = PsychologyAnalyzerHF.detect_mental_health_indicators(text)
        
        return {
            "success": True,
            "fake_news_analysis": fake_news_result,
            "psychological_analysis": psych_result,
            "mental_health_indicators": mental_health_result,
            "datasets_used": [
                "LIAR", "RumorEval", "COVID-19 Misinformation", "FakeNewsNet",
                "GoEmotions", "Emotion Classification", "Toxicity", "Mental Health Support"
            ],
            "total_datasets": 8
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
