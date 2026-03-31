"""
Social Media Import Service
Handles content import from Facebook, Instagram, Twitter, Telegram, WhatsApp, TikTok, YouTube, etc.
"""
import re
from typing import Dict, Optional, List
from datetime import datetime


class SocialMediaImporter:
    """Imports and extracts content from social media platforms"""

    SUPPORTED_PLATFORMS = {
        'facebook': 'Facebook',
        'instagram': 'Instagram',
        'twitter': 'Twitter/X',
        'telegram': 'Telegram',
        'whatsapp': 'WhatsApp',
        'tiktok': 'TikTok',
        'youtube': 'YouTube',
        'reddit': 'Reddit',
        'linkedin': 'LinkedIn',
        'threads': 'Threads',
    }

    @classmethod
    def import_content(cls, source: str, content: str, url: Optional[str] = None, 
                      metadata: Optional[Dict] = None) -> Dict:
        """
        Import content from social media
        Returns normalized content with metadata
        """
        platform_key = source.lower().strip()
        
        if platform_key not in cls.SUPPORTED_PLATFORMS:
            raise ValueError(f"Unsupported platform: {source}. Supported: {', '.join(cls.SUPPORTED_PLATFORMS.keys())}")

        # Parse and clean content
        parsed_content = cls._parse_platform_content(platform_key, content)
        
        # Extract metadata
        extracted_metadata = cls._extract_metadata(platform_key, content, url, metadata)
        
        return {
            'platform': cls.SUPPORTED_PLATFORMS[platform_key],
            'platform_key': platform_key,
            'raw_content': content,
            'parsed_content': parsed_content,
            'metadata': extracted_metadata,
            'extracted_at': datetime.now().isoformat(),
        }

    @classmethod
    def _parse_platform_content(cls, platform: str, content: str) -> str:
        """Parse and normalize content from specific platform"""
        
        if platform == 'twitter' or platform == 'threads':
            return cls._parse_twitter(content)
        elif platform == 'facebook':
            return cls._parse_facebook(content)
        elif platform == 'instagram':
            return cls._parse_instagram(content)
        elif platform == 'telegram':
            return cls._parse_telegram(content)
        elif platform == 'whatsapp':
            return cls._parse_whatsapp(content)
        elif platform == 'tiktok':
            return cls._parse_tiktok(content)
        elif platform == 'youtube':
            return cls._parse_youtube(content)
        elif platform == 'reddit':
            return cls._parse_reddit(content)
        elif platform == 'linkedin':
            return cls._parse_linkedin(content)
        
        return content.strip()

    @classmethod
    def _parse_twitter(cls, content: str) -> str:
        """Parse Twitter/X content - remove URLs, @mentions, #hashtags for analysis"""
        text = content.strip()
        # Remove URLs
        text = re.sub(r'http\S+|www\S+', '', text)
        # Keep content but note mentions/hashtags
        text = re.sub(r'\n\n+', '\n', text)
        return text.strip()

    @classmethod
    def _parse_facebook(cls, content: str) -> str:
        """Parse Facebook post"""
        # Remove share buttons, timestamps, metadata
        text = content.strip()
        text = re.sub(r'Share|Like|Comment|React', '', text, flags=re.IGNORECASE)
        return text.strip()

    @classmethod
    def _parse_instagram(cls, content: str) -> str:
        """Parse Instagram caption and comments"""
        text = content.strip()
        # Remove emoji reactions (keep text content)
        text = re.sub(r'https?://\S+', '[LINK]', text)
        return text.strip()

    @classmethod
    def _parse_telegram(cls, content: str) -> str:
        """Parse Telegram message"""
        text = content.strip()
        # Remove forwarding info, timeinfo
        text = re.sub(r'Forwarded from.*', '', text)
        return text.strip()

    @classmethod
    def _parse_whatsapp(cls, content: str) -> str:
        """Parse WhatsApp message"""
        text = content.strip()
        # Remove timestamps like [12:34 PM]
        text = re.sub(r'\[\d{1,2}:\d{2}(?:\s?[AP]M)?\]', '', text)
        # Remove contact labels
        text = re.sub(r'^[\w\s]+:', '', text, flags=re.MULTILINE)
        return text.strip()

    @classmethod
    def _parse_tiktok(cls, content: str) -> str:
        """Parse TikTok caption and comments"""
        text = content.strip()
        # Remove hashtags for analysis (keep text)
        text = text.strip()
        return text

    @classmethod
    def _parse_youtube(cls, content: str) -> str:
        """Parse YouTube comment/description"""
        text = content.strip()
        text = re.sub(r'https?://\S+', '[LINK]', text)
        return text.strip()

    @classmethod
    def _parse_reddit(cls, content: str) -> str:
        """Parse Reddit post/comment"""
        text = content.strip()
        # Could extract title + body
        return text.strip()

    @classmethod
    def _parse_linkedin(cls, content: str) -> str:
        """Parse LinkedIn post"""
        text = content.strip()
        return text.strip()

    @classmethod
    def _extract_metadata(cls, platform: str, content: str, url: Optional[str] = None,
                         custom_metadata: Optional[Dict] = None) -> Dict:
        """Extract platform-specific metadata"""
        
        metadata = {
            'platform': platform,
            'url': url,
            'extracted_date': datetime.now().isoformat(),
        }

        # Count engagement indicators
        metadata['likes'] = custom_metadata.get('likes', 0) if custom_metadata else 0
        metadata['shares'] = custom_metadata.get('shares', 0) if custom_metadata else 0
        metadata['comments'] = custom_metadata.get('comments', 0) if custom_metadata else 0
        metadata['hashtags'] = cls._extract_hashtags(content)
        metadata['mentions'] = cls._extract_mentions(content)
        metadata['urls'] = cls._extract_urls(content)
        metadata['has_media'] = '@' in content or '#' in content or 'http' in content

        # Platform-specific metadata
        if platform == 'twitter':
            metadata['is_retweet'] = content.startswith('RT @')
            metadata['has_reply_to'] = '@' in content
        elif platform == 'facebook':
            metadata['is_shared'] = 'Shared' in content
        elif platform == 'instagram':
            metadata['has_hashtags'] = len(metadata['hashtags']) > 0
        elif platform == 'youtube':
            metadata['can_be_pinned'] = True

        if custom_metadata:
            metadata.update(custom_metadata)

        return metadata

    @staticmethod
    def _extract_hashtags(content: str) -> List[str]:
        """Extract hashtags from content"""
        return re.findall(r'#\w+', content)

    @staticmethod
    def _extract_mentions(content: str) -> List[str]:
        """Extract user mentions from content"""
        return re.findall(r'@\w+', content)

    @staticmethod
    def _extract_urls(content: str) -> List[str]:
        """Extract URLs from content"""
        return re.findall(r'https?://\S+', content)

    @classmethod
    def validate_platform(cls, platform: str) -> bool:
        """Validate if platform is supported"""
        return platform.lower() in cls.SUPPORTED_PLATFORMS

    @classmethod
    def get_supported_platforms(cls) -> List[str]:
        """Get list of supported platforms"""
        return list(cls.SUPPORTED_PLATFORMS.values())
