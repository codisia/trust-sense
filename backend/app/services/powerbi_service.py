"""Power BI integration service for Trust Sense."""

import json
import requests
from typing import Optional, Dict, List, Any
from app.core.config import settings
from datetime import datetime


class PowerBIClient:
    """Client for Power BI REST API integration."""
    
    def __init__(self, dataset_id: str = None, token: str = None):
        self.dataset_id = dataset_id or settings.POWERBI_DATASET_ID
        self.token = token or settings.POWERBI_TOKEN
        self.api_url = settings.POWERBI_API_URL
        self.table_name = settings.POWERBI_TABLE_NAME
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def is_configured(self) -> bool:
        """Check if Power BI is properly configured."""
        return bool(self.dataset_id and self.token)
    
    def push_analysis_result(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Push analysis result to Power BI dataset."""
        if not self.is_configured():
            return {
                "success": False,
                "error": "Power BI not configured. Set POWERBI_DATASET_ID and POWERBI_TOKEN in .env"
            }
        
        try:
            # Format data for Power BI
            row_data = self._format_analysis_for_powerbi(analysis_data)
            
            # Push to Power BI
            url = f"{self.api_url}/datasets/{self.dataset_id}/tables/{self.table_name}/rows"
            payload = {"rows": [row_data]}
            
            response = requests.post(url, json=payload, headers=self.headers)
            
            if response.status_code in [200, 201]:
                return {
                    "success": True,
                    "message": "Data pushed to Power BI successfully"
                }
            else:
                return {
                    "success": False,
                    "error": f"Power BI API error: {response.text}"
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def push_batch_analysis(self, analysis_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Push multiple analysis results to Power BI."""
        if not self.is_configured():
            return {
                "success": False,
                "error": "Power BI not configured"
            }
        
        try:
            rows = [self._format_analysis_for_powerbi(data) for data in analysis_list]
            
            url = f"{self.api_url}/datasets/{self.dataset_id}/tables/{self.table_name}/rows"
            payload = {"rows": rows}
            
            response = requests.post(url, json=payload, headers=self.headers)
            
            if response.status_code in [200, 201]:
                return {
                    "success": True,
                    "rows_pushed": len(rows)
                }
            else:
                return {
                    "success": False,
                    "error": f"Power BI API error: {response.text}"
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_dataset_info(self) -> Dict[str, Any]:
        """Get information about the Power BI dataset."""
        if not self.is_configured():
            return {"error": "Power BI not configured"}
        
        try:
            url = f"{self.api_url}/datasets/{self.dataset_id}"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API error: {response.text}"}
        
        except Exception as e:
            return {"error": str(e)}
    
    def clear_table(self) -> Dict[str, Any]:
        """Clear all rows from the Power BI table."""
        if not self.is_configured():
            return {"error": "Power BI not configured"}
        
        try:
            url = f"{self.api_url}/datasets/{self.dataset_id}/tables/{self.table_name}/rows"
            response = requests.delete(url, headers=self.headers)
            
            if response.status_code in [200, 201]:
                return {"success": True, "message": "Table cleared"}
            else:
                return {"error": f"API error: {response.text}"}
        
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def _format_analysis_for_powerbi(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format analysis data for Power BI ingestion."""
        return {
            "AnalysisID": str(analysis_data.get('id', '')),
            "UserID": str(analysis_data.get('user_id', '')),
            "InputType": str(analysis_data.get('input_type', 'text')),
            "TrustScore": float(analysis_data.get('trust_score', 0)),
            "Sentiment": float(analysis_data.get('sentiment', 0)),
            "Credibility": float(analysis_data.get('credibility', 0)),
            "FakeNewsProbability": float(analysis_data.get('fake_news_probability', 0)),
            "ManipulationScore": float(analysis_data.get('manipulation_score', 0)),
            "RiskLevel": str(analysis_data.get('risk_level', 'LOW')),
            "DominantEmotion": str(analysis_data.get('dominant_emotion', 'Neutral')),
            "VoiceEmotion": str(analysis_data.get('voice_emotion', None) or 'N/A'),
            "DeepfakeProbability": float(analysis_data.get('deepfake_probability', 0)),
            "Summary": str(analysis_data.get('summary', ''))[:500],  # Limit to 500 chars
            "Timestamp": datetime.utcnow().isoformat(),
        }


def sync_analysis_to_powerbi(analysis_id: int, db_session) -> Dict[str, Any]:
    """Sync a single analysis result from database to Power BI."""
    try:
        from app.models.models import Analysis
        
        analysis = db_session.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return {"error": f"Analysis {analysis_id} not found"}
        
        client = PowerBIClient()
        
        analysis_data = {
            "id": analysis.id,
            "user_id": analysis.user_id,
            "input_type": analysis.input_type,
            "trust_score": analysis.trust_score,
            "sentiment": analysis.sentiment,
            "credibility": analysis.credibility,
            "fake_news_probability": analysis.fake_news_probability,
            "manipulation_score": analysis.manipulation_score,
            "risk_level": analysis.risk_level,
            "dominant_emotion": analysis.dominant_emotion,
            "voice_emotion": analysis.voice_emotion,
            "deepfake_probability": analysis.deepfake_probability,
            "summary": analysis.summary,
        }
        
        result = client.push_analysis_result(analysis_data)
        
        if result.get("success"):
            # Update sync flag in database
            analysis.powerbi_synced = 1
            db_session.commit()
        
        return result
    
    except Exception as e:
        return {"error": str(e)}


def sync_all_analyses_to_powerbi(db_session) -> Dict[str, Any]:
    """Sync all unsynced analyses from database to Power BI."""
    try:
        from app.models.models import Analysis
        
        unsynced = db_session.query(Analysis).filter(Analysis.powerbi_synced == 0).all()
        
        if not unsynced:
            return {"message": "No unsynced analyses", "synced_count": 0}
        
        client = PowerBIClient()
        
        analyses_data = []
        for analysis in unsynced:
            data = {
                "id": analysis.id,
                "user_id": analysis.user_id,
                "input_type": analysis.input_type,
                "trust_score": analysis.trust_score,
                "sentiment": analysis.sentiment,
                "credibility": analysis.credibility,
                "fake_news_probability": analysis.fake_news_probability,
                "manipulation_score": analysis.manipulation_score,
                "risk_level": analysis.risk_level,
                "dominant_emotion": analysis.dominant_emotion,
                "voice_emotion": analysis.voice_emotion,
                "deepfake_probability": analysis.deepfake_probability,
                "summary": analysis.summary,
            }
            analyses_data.append(data)
        
        result = client.push_batch_analysis(analyses_data)
        
        if result.get("success"):
            # Update sync flags
            for analysis in unsynced:
                analysis.powerbi_synced = 1
            db_session.commit()
        
        return result
    
    except Exception as e:
        return {"error": str(e)}


def create_powerbi_dataset_template() -> Dict[str, Any]:
    """Generate schema template for Power BI dataset creation."""
    return {
        "dataset_name": "trust_sense_analysis",
        "tables": [
            {
                "name": "AnalysisResults",
                "columns": [
                    {"name": "AnalysisID", "dataType": "string"},
                    {"name": "UserID", "dataType": "string"},
                    {"name": "InputType", "dataType": "string"},
                    {"name": "TrustScore", "dataType": "double"},
                    {"name": "Sentiment", "dataType": "double"},
                    {"name": "Credibility", "dataType": "double"},
                    {"name": "FakeNewsProbability", "dataType": "double"},
                    {"name": "ManipulationScore", "dataType": "double"},
                    {"name": "RiskLevel", "dataType": "string"},
                    {"name": "DominantEmotion", "dataType": "string"},
                    {"name": "VoiceEmotion", "dataType": "string"},
                    {"name": "DeepfakeProbability", "dataType": "double"},
                    {"name": "Summary", "dataType": "string"},
                    {"name": "Timestamp", "dataType": "datetime"},
                ]
            }
        ],
        "description": "Trust Sense analysis results for Power BI visualization"
    }
