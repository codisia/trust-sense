"""
Tests for AI News Broadcasting System
Tests the complete news pipeline: collection → analysis → generation → publishing
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient

from app.main import app
from codexia_platform.ai_news.collector.rss_collector import RSSCollector
from codexia_platform.ai_news.collector.newsapi_collector import NewsAPICollector
from codexia_platform.ai_news.analyzer.analyzer import NewsAnalyzer
from codexia_platform.ai_news.generator.script_generator import ScriptGenerator
from codexia_platform.ai_news.video.heygens import HeyGenVideoGenerator
from codexia_platform.ai_news.publisher.publisher import NewsPublisher
from codexia_platform.ai_news.scheduler.scheduler import NewsScheduler


class TestNewsCollection:
    """Test news collection modules"""

    @pytest.mark.asyncio
    async def test_rss_collector(self):
        """Test RSS feed collection"""
        collector = RSSCollector()

        # Mock RSS feed response
        mock_feed = {
            'entries': [
                {
                    'title': 'Test News Article',
                    'summary': 'Test summary',
                    'link': 'https://example.com/article1',
                    'published': '2024-01-01T00:00:00Z'
                }
            ]
        }

        with patch('feedparser.parse', return_value=mock_feed):
            articles = await collector.collect_news(['https://example.com/rss'])

            assert len(articles) == 1
            assert articles[0]['title'] == 'Test News Article'
            assert articles[0]['url'] == 'https://example.com/article1'

    @pytest.mark.asyncio
    async def test_newsapi_collector(self):
        """Test NewsAPI collection"""
        collector = NewsAPICollector(api_key='test_key')

        mock_response = {
            'articles': [
                {
                    'title': 'API News Article',
                    'description': 'API description',
                    'url': 'https://newsapi.com/article1',
                    'publishedAt': '2024-01-01T00:00:00Z',
                    'source': {'name': 'Test Source'}
                }
            ]
        }

        with patch('requests.get') as mock_get:
            mock_get.return_value.json.return_value = mock_response

            articles = await collector.collect_news(['technology'])

            assert len(articles) == 1
            assert articles[0]['title'] == 'API News Article'


class TestNewsAnalysis:
    """Test news analysis integration"""

    @pytest.mark.asyncio
    async def test_news_analyzer(self):
        """Test news analysis with Trust Sense"""
        analyzer = NewsAnalyzer()

        test_article = {
            'title': 'Test Article',
            'content': 'This is test content about technology.',
            'url': 'https://example.com'
        }

        # Mock the Trust Sense analysis
        mock_analysis = {
            'trust_score': 85,
            'credibility': 'high',
            'sentiment': 'neutral',
            'manipulation_risk': 'low'
        }

        with patch.object(analyzer, 'analyze_article', return_value=mock_analysis):
            result = await analyzer.analyze_article(test_article)

            assert result['trust_score'] == 85
            assert result['credibility'] == 'high'


class TestScriptGeneration:
    """Test script generation"""

    @pytest.mark.asyncio
    async def test_script_generator(self):
        """Test multilingual script generation"""
        generator = ScriptGenerator()

        test_article = {
            'title': 'Test News',
            'content': 'Breaking news content',
            'analysis': {'trust_score': 90}
        }

        with patch('transformers.pipeline') as mock_pipeline:
            mock_pipeline.return_value.return_value = ['Generated script content']

            scripts = await generator.generate_scripts(test_article, ['en', 'es'])

            assert 'en' in scripts
            assert 'es' in scripts
            assert len(scripts['en']) > 0


class TestVideoGeneration:
    """Test video generation"""

    @pytest.mark.asyncio
    async def test_heygens_video_generation(self):
        """Test HeyGen video generation"""
        generator = HeyGenVideoGenerator(api_key='test_key')

        test_script = 'This is a test script for video generation.'

        with patch('requests.post') as mock_post:
            mock_post.return_value.json.return_value = {
                'video_id': 'test_video_123',
                'status': 'processing'
            }

            result = await generator.generate_video(test_script, 'en')

            assert result['video_id'] == 'test_video_123'
            assert result['status'] == 'processing'


class TestNewsPublishing:
    """Test news publishing"""

    @pytest.mark.asyncio
    async def test_youtube_publisher(self):
        """Test YouTube publishing"""
        publisher = NewsPublisher()

        test_video = {
            'video_path': '/path/to/video.mp4',
            'title': 'Test News Video',
            'description': 'Generated news video'
        }

        with patch('googleapiclient.discovery.build') as mock_build:
            mock_youtube = MagicMock()
            mock_build.return_value = mock_youtube
            mock_youtube.videos.return_value.insert.return_value.execute.return_value = {
                'id': 'test_video_id'
            }

            result = await publisher.publish_to_youtube(test_video)

            assert result['video_id'] == 'test_video_id'


class TestNewsAPI:
    """Test news API endpoints"""

    @pytest.mark.asyncio
    async def test_news_pipeline_endpoint(self):
        """Test complete news pipeline execution"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "sources": ["rss", "newsapi"],
                "categories": ["technology"],
                "languages": ["en"]
            }

            # Mock the pipeline execution
            with patch('app.services.news_service.NewsService.run_pipeline') as mock_pipeline:
                mock_pipeline.return_value = {
                    "status": "success",
                    "articles_processed": 5,
                    "videos_generated": 2
                }

                response = await client.post("/api/news/run-pipeline", json=payload)

                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "success"

    @pytest.mark.asyncio
    async def test_get_news_articles(self):
        """Test retrieving news articles"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            with patch('app.services.news_service.NewsService.get_articles') as mock_get:
                mock_get.return_value = [
                    {
                        "id": 1,
                        "title": "Test Article",
                        "trust_score": 85,
                        "published_at": "2024-01-01T00:00:00Z"
                    }
                ]

                response = await client.get("/api/news/articles")

                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
                assert data[0]["title"] == "Test Article"


class TestNewsScheduler:
    """Test background scheduling"""

    @pytest.mark.asyncio
    async def test_scheduler_initialization(self):
        """Test scheduler setup"""
        scheduler = NewsScheduler()

        # Mock APScheduler
        with patch('apscheduler.schedulers.asyncio.AsyncIOScheduler'):
            await scheduler.start()

            # Should not raise any exceptions
            assert scheduler is not None