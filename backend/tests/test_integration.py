"""
Integration tests for TRUST SENSE platform
Tests data flow: Content → AI Analysis → DB Storage → Dashboard Display
"""

import pytest
import json
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.main import app
from app.core.config import settings
from app.schemas.schemas import AnalysisRequest


class TestTextAnalysis:
    """Test text analysis endpoint and data flow"""
    
    @pytest.mark.asyncio
    async def test_analyze_text_endpoint(self):
        """Test basic text analysis endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "content": "What's happening with inflation? Prices are skyrocketing!!!",
                "content_type": "text",
                "source": "user_input"
            }
            
            response = await client.post("/api/analyze-text", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            
            # Validate response structure
            assert "analysis_id" in data
            assert "content_type" in data
            assert "results" in data
            
            results = data["results"]
            assert "sentiment" in results
            assert "credibility" in results
            assert "manipulation" in results
            assert "trust_score" in results
            assert "risk_level" in results
    
    @pytest.mark.asyncio
    async def test_psychological_analysis_in_text(self):
        """Test psychological metrics in text analysis"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "content": "You MUST act now! Everyone who doesn't agree is WRONG!!! This is urgent!!!",
                "content_type": "text",
                "source": "social_media"
            }
            
            response = await client.post("/api/analyze-text", json=payload)
            data = response.json()
            results = data["results"]
            
            # Verify psychological metrics detected
            assert "psychological_metrics" in results
            metrics = results["psychological_metrics"]
            
            assert "aggression_score" in metrics
            assert "persuasion_score" in metrics
            assert "cognitive_bias_score" in metrics
            assert metrics["aggression_score"] > 70  # High due to caps
            assert metrics["cognitive_bias_score"] > 60  # Urgency + absolutes


class TestMultimodalAnalysis:
    """Test multimodal analysis combining multiple content types"""
    
    @pytest.mark.asyncio
    async def test_multimodal_analysis(self):
        """Test combined text + audio analysis"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "content": "Climate change is a hoax perpetrated by communists",
                "content_type": "multimodal",
                "components": {
                    "text": "Climate change is a hoax",
                    "audio_transcript": "We need to stop believing climate lies"
                },
                "source": "video_clip"
            }
            
            response = await client.post("/api/analyze-multimodal", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify multimodal aggregation
            assert "component_analyses" in data
            assert "text" in data["component_analyses"]
            assert "audio" in data["component_analyses"]
            assert "aggregate_trust_score" in data["results"]


class TestPlatformIntegrations:
    """Test multi-platform integration endpoints"""
    
    @pytest.mark.asyncio
    async def test_desktop_app_full_analysis(self):
        """Test desktop app analysis endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "content": "Breaking news: Study finds correlation",
                "content_type": "text",
                "include_history": True
            }
            
            response = await client.post(
                "/api/platforms/desktop/analyze",
                json=payload,
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Desktop should have rich data
            assert "full_analysis" in data
            assert "history_count" in data
            assert "recommendations" in data
    
    @pytest.mark.asyncio
    async def test_mobile_app_quick_analyze(self):
        """Test mobile app lightweight endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "content": "Breaking news: Study finds correlation",
                "content_type": "text"
            }
            
            response = await client.post(
                "/api/platforms/mobile/quick-analyze",
                json=payload,
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Mobile should have minimal data
            assert "trust_score" in data
            assert "risk_level" in data
            # Should NOT have detailed breakdowns
            assert "detailed_analysis" not in data or len(data.get("detailed_analysis", {})) <= 3
    
    @pytest.mark.asyncio
    async def test_chrome_extension_page_analysis(self):
        """Test Chrome extension page analysis"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "page_url": "https://example.com/article",
                "page_title": "Fake News Site",
                "page_content": "This is totally fake news!!!"
            }
            
            response = await client.post(
                "/api/platforms/chrome/analyze-page",
                json=payload,
                headers={"X-API-Key": "chrome-ext-key"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "verdict" in data
            assert "summary" in data
            assert data["verdict"] in ["SAFE", "CAUTION", "DANGEROUS"]
    
    @pytest.mark.asyncio
    async def test_email_plugin_phishing_detection(self):
        """Test email plugin phishing detection"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "email_subject": "Urgent: Verify Your Account Now",
                "email_body": "Click here immediately to update your password",
                "sender": "noreply@example.com",
                "recipient": "user@test.com"
            }
            
            response = await client.post(
                "/api/platforms/email/analyze-message",
                json=payload,
                headers={"X-API-Key": "email-plugin-key"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "is_phishing" in data
            assert "phishing_score" in data
            assert "is_spam" in data
            assert data["phishing_score"] > 60  # Should detect urgency language
    
    @pytest.mark.asyncio
    async def test_chatbot_facebook_webhook(self):
        """Test Facebook Messenger chatbot webhook"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "entry": [{
                    "messaging": [{
                        "sender": {"id": "123"},
                        "message": {"text": "Is this true?"}
                    }]
                }]
            }
            
            response = await client.post(
                "/api/chatbot/facebook/webhook",
                json=payload
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
    
    @pytest.mark.asyncio
    async def test_chatbot_status(self):
        """Test chatbot health check"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/chatbot/status")
            
            assert response.status_code == 200
            data = response.json()
            
            assert "facebook" in data
            assert "whatsapp" in data
            assert "telegram" in data
            assert data["facebook"]["status"] in ["active", "inactive"]


class TestDatasetManagement:
    """Test dataset management endpoints"""
    
    @pytest.mark.asyncio
    async def test_list_datasets(self):
        """Test listing available datasets"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/datasets/list",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "datasets" in data
            assert isinstance(data["datasets"], list)
            
            # Check domain coverage
            domains = set()
            for ds in data["datasets"]:
                assert "domain" in ds
                assert "name" in ds
                assert "sample_count" in ds
                domains.add(ds["domain"])
            
            # Should have at least the main domains
            expected_domains = {"psychology", "health", "education"}
            assert expected_domains.issubset(domains)
    
    @pytest.mark.asyncio
    async def test_dataset_info(self):
        """Test retrieving dataset metadata"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/datasets/psychology-001/info",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "domain" in data
            assert "total_records" in data
            assert "train_test_split" in data
            assert "model_performance" in data
            
            perf = data["model_performance"]
            assert "accuracy" in perf
            assert "precision" in perf
            assert "recall" in perf
            assert "f1_score" in perf
    
    @pytest.mark.asyncio
    async def test_dataset_samples(self):
        """Test getting sample records from dataset"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/datasets/psychology-001/samples?limit=5",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "samples" in data
            assert isinstance(data["samples"], list)
            assert len(data["samples"]) <= 5
            
            # Each sample should be valid JSONL record
            for sample in data["samples"]:
                assert "text" in sample or "content" in sample
                assert "label" in sample or "annotation" in sample


class TestDashboards:
    """Test dashboard and analytics endpoints"""
    
    @pytest.mark.asyncio
    async def test_personal_dashboard(self):
        """Test personal dashboard retrieval"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/dashboards/personal?period=30days",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify dashboard structure
            assert "summary" in data
            assert "metrics" in data
            assert "charts" in data
            
            summary = data["summary"]
            assert "total_analyses" in summary
            assert "average_trust_score" in summary
            assert "risk_distribution" in summary
    
    @pytest.mark.asyncio
    async def test_organization_dashboard(self):
        """Test organization-wide dashboard"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/dashboards/organization?period=30days",
                headers={
                    "Authorization": "Bearer test-token",
                    "X-Organization-ID": "org-123"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "summary" in data
            assert "member_statistics" in data
            assert "domain_breakdown" in data
    
    @pytest.mark.asyncio
    async def test_analytics_trends(self):
        """Test trend analytics"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/dashboards/analytics/trends?metric=trust_score&period=7days&granularity=daily",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "metric" in data
            assert "data_points" in data
            assert isinstance(data["data_points"], list)
            
            for point in data["data_points"]:
                assert "date" in point
                assert "value" in point
    
    @pytest.mark.asyncio
    async def test_csv_export(self):
        """Test CSV export streaming"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/dashboards/reports/csv?period=7days",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/csv"
            
            # Verify CSV content
            content = response.text
            assert len(content) > 0
            lines = content.split("\n")
            assert len(lines) > 1  # Header + data


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    @pytest.mark.asyncio
    async def test_missing_authentication(self):
        """Test endpoint without auth token"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/dashboards/personal")
            
            assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_invalid_content_type(self):
        """Test analysis with invalid content type"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "content": "Some content",
                "content_type": "invalid_type"
            }
            
            response = await client.post("/api/analyze-text", json=payload)
            
            assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_empty_content(self):
        """Test analysis with empty content"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "content": "",
                "content_type": "text"
            }
            
            response = await client.post("/api/analyze-text", json=payload)
            
            assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_oversized_content(self):
        """Test analysis with oversized content"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "content": "x" * (10 * 1024 * 1024),  # 10MB
                "content_type": "text"
            }
            
            response = await client.post("/api/analyze-text", json=payload)
            
            assert response.status_code == 413  # Payload too large


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for asyncio tests"""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
