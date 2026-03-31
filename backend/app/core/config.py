from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Load .env from root directory (parent of backend). Use override=False so Docker/env vars always win.
import pathlib
_backend_dir = pathlib.Path(__file__).resolve().parent.parent.parent
_root_dir = _backend_dir.parent  # Go up to root where .env is

# Load env files - convert Path to string for load_dotenv
_root_env_path = str(_root_dir / ".env")
_backend_env_path = str(_backend_dir / ".env")

load_dotenv(_root_env_path, override=False)  # Load from root .env
load_dotenv(_backend_env_path, override=False)  # Also try backend/.env for overrides
load_dotenv(override=False)  # Also try cwd


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./trust_sense.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # AI Services - Get free keys from:
    # Groq: https://console.groq.com/keys
    # HuggingFace: https://huggingface.co/settings/tokens
    # Anthropic: https://console.anthropic.com/
    HUGGINGFACE_API_KEY: str = "your_huggingface_api_key_here"
    GROQ_API_KEY: str = "your_groq_api_key_here"
    ANTHROPIC_API_KEY: str = ""
    
    # Power BI Integration
    POWERBI_TENANT_ID: str = ""
    POWERBI_CLIENT_ID: str = ""
    POWERBI_CLIENT_SECRET: str = ""
    POWERBI_API_URL: str = "https://api.powerbi.com/v1.0/myorg"
    POWERBI_DATASET_ID: str = ""
    POWERBI_TABLE_NAME: str = "AnalysisResults"
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    # LinkedIn OAuth Configuration
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_REDIRECT_URI: str = "http://localhost:8000/auth/linkedin/callback"

    # X (Twitter) OAuth Configuration
    X_CLIENT_ID: str = ""
    X_CLIENT_SECRET: str = ""
    X_REDIRECT_URI: str = "http://localhost:8000/auth/x/callback"
    
    # CORS Configuration
    CORS_ORIGINS: str = "*"
    
    # Environment
    ENVIRONMENT: str = "development"

    model_config = {"env_file": _root_env_path, "extra": "ignore"}


settings = Settings()

# Print active API configuration on startup
# Configuration loaded - API keys validated
# Remove startup debug print statements for production security

# Production mode - do not output debug information


