"""
Example Desktop Client Implementation for TRUST SENSE API
Demonstrates full-featured analysis with history and local storage
"""

import httpx
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import asyncio


class TrustSenseDesktopClient:
    """Production-ready desktop client for TRUST SENSE API"""
    
    def __init__(self, api_url: str = "http://localhost:8000", api_key: Optional[str] = None):
        """
        Initialize desktop client
        
        Args:
            api_url: Backend API base URL
            api_key: Optional API key for authentication
        """
        self.api_url = api_url
        self.api_key = api_key
        self.session = None
        self.db_path = Path.home() / ".trust-sense" / "local.db"
        self._init_local_db()
    
    def _init_local_db(self):
        """Initialize local SQLite database for offline storage"""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                content_type TEXT,
                results JSON,
                trust_score REAL,
                risk_level TEXT,
                analyzed_at TIMESTAMP,
                synced INTEGER DEFAULT 0
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY,
                analysis_id TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    async def analyze_text(self, content: str, save_locally: bool = True) -> Dict[str, Any]:
        """
        Analyze text content
        
        Args:
            content: Text to analyze
            save_locally: Whether to save analysis locally
            
        Returns:
            Analysis results with trust score and recommendations
        """
        async with httpx.AsyncClient() as client:
            payload = {
                "content": content,
                "content_type": "text",
                "source": "desktop_app"
            }
            
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            try:
                response = await client.post(
                    f"{self.api_url}/api/analyze-text",
                    json=payload,
                    headers=headers,
                    timeout=30
                )
                response.raise_for_status()
                
                result = response.json()
                
                # Save to local database
                if save_locally:
                    self._save_analysis_locally(result)
                
                return result
                
            except httpx.TimeoutException:
                raise Exception("Analysis timeout - API taking too long")
            except httpx.HTTPStatusError as e:
                raise Exception(f"API error: {e.response.status_code} - {e.response.text}")
    
    async def analyze_multimodal(self, text: str, audio_url: Optional[str] = None,
                                 video_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform multimodal analysis (text + audio + video)
        
        Args:
            text: Text content
            audio_url: URL to audio file
            video_url: URL to video file
            
        Returns:
            Aggregated analysis from all modalities
        """
        async with httpx.AsyncClient() as client:
            payload = {
                "content": text,
                "content_type": "multimodal",
                "components": {
                    "text": text
                }
            }
            
            if audio_url:
                payload["components"]["audio_url"] = audio_url
            if video_url:
                payload["components"]["video_url"] = video_url
            
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            response = await client.post(
                f"{self.api_url}/api/analyze-multimodal",
                json=payload,
                headers=headers,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
    
    async def get_analysis_history(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        Retrieve user's analysis history from backend
        
        Args:
            limit: Number of results to return
            offset: Pagination offset
            
        Returns:
            List of past analyses with pagination info
        """
        async with httpx.AsyncClient() as client:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            response = await client.get(
                f"{self.api_url}/api/platforms/desktop/history",
                params={"limit": limit, "offset": offset},
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_dashboard(self, period: str = "30days") -> Dict[str, Any]:
        """
        Retrieve personal dashboard analytics
        
        Args:
            period: Time period filter (7days, 30days, 90days, all)
            
        Returns:
            Dashboard data with charts and metrics
        """
        async with httpx.AsyncClient() as client:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            response = await client.get(
                f"{self.api_url}/api/dashboards/personal",
                params={"period": period},
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    def _save_analysis_locally(self, analysis: Dict[str, Any]):
        """Save analysis result to local database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO analyses 
            (id, content, content_type, results, trust_score, risk_level, analyzed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            analysis["analysis_id"],
            analysis["content"],
            analysis["content_type"],
            json.dumps(analysis["results"]),
            analysis["results"]["trust_score"],
            analysis["results"]["risk_level"],
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def get_local_history(self, limit: int = 50) -> list:
        """Retrieve analysis history from local database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, content, trust_score, risk_level, analyzed_at 
            FROM analyses 
            ORDER BY analyzed_at DESC 
            LIMIT ?
        """, (limit,))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                "id": row[0],
                "content": row[1][:100],  # First 100 chars
                "trust_score": row[2],
                "risk_level": row[3],
                "analyzed_at": row[4]
            })
        
        conn.close()
        return results
    
    def add_favorite(self, analysis_id: str):
        """Mark an analysis as favorite"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR IGNORE INTO favorites (analysis_id)
            VALUES (?)
        """, (analysis_id,))
        
        conn.commit()
        conn.close()
    
    def get_favorites(self) -> list:
        """Get all favorite analyses"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT a.id, a.content, a.trust_score, a.risk_level 
            FROM analyses a
            JOIN favorites f ON a.id = f.analysis_id
            ORDER BY f.created_at DESC
        """)
        
        results = []
        for row in cursor.fetchall():
            results.append({
                "id": row[0],
                "content": row[1][:100],
                "trust_score": row[2],
                "risk_level": row[3]
            })
        
        conn.close()
        return results


# Example usage
async def main():
    # Initialize client
    client = TrustSenseDesktopClient(
        api_url="http://localhost:8000",
        api_key="your-api-key"
    )
    
    # Analyze some text
    print("Analyzing text...")
    result = await client.analyze_text(
        "BREAKING NEWS: This is definitely true and everyone must act NOW!!!"
    )
    
    print(f"Trust Score: {result['results']['trust_score']}")
    print(f"Risk Level: {result['results']['risk_level']}")
    print(f"Recommendations: {result['results']['recommendations']}")
    
    # Get local history
    print("\nLocal Analysis History:")
    history = client.get_local_history(limit=5)
    for analysis in history:
        print(f"- {analysis['content']}: {analysis['trust_score']}")
    
    # Get dashboard
    print("\nGetting dashboard...")
    dashboard = await client.get_dashboard(period="30days")
    print(f"Total analyses: {dashboard['summary']['total_analyses']}")
    print(f"Average trust score: {dashboard['summary']['average_trust_score']}")


if __name__ == "__main__":
    asyncio.run(main())
