from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
 
import requests
from typing import Optional
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.core.supabase_auth import (
    get_supabase_config,
    validate_supabase_token,
    get_supabase_user_from_token,
)
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with email/password."""
    try:
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        if db.query(User).filter(User.username == user_data.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        user = User(
            email=user_data.email,
            username=user_data.username,
            password_hash=get_password_hash(user_data.password),
            role=user_data.role or "analyst",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email/password."""
    try:
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Account deactivated")
        token = create_access_token({"sub": str(user.id), "role": user.role})
        return {"access_token": token, "token_type": "bearer", "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Login failed")


# ============ SUPABASE CONFIGURATION ============

@router.get("/supabase/status", tags=["Supabase"])
def supabase_status():
    """Check if Supabase is configured and get configuration."""
    config = get_supabase_config()
    return config


@router.get("/supabase/oauth-providers", tags=["Supabase"])
def get_oauth_providers():
    """Get list of available OAuth providers configured in Supabase."""
    config = get_supabase_config()
    
    if not config["configured"]:
        raise HTTPException(
            status_code=400,
            detail="Supabase is not configured"
        )
    
    return {
        "providers": config["oauth_providers"],
        "message": f"Available OAuth providers: {', '.join(config['oauth_providers'])}"
    }


@router.post("/supabase/callback", tags=["Supabase"])
def supabase_oauth_callback(
    access_token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Handle Supabase OAuth callback.
    After Supabase OAuth, exchange Supabase token for app JWT.
    """
    try:
        # Validate Supabase token
        payload = validate_supabase_token(access_token)
        if not payload:
            raise HTTPException(
                status_code=400,
                detail="Invalid Supabase token"
            )
        
        # Get or auto-create user
        user = get_supabase_user_from_token(access_token, db)
        if not user:
            raise HTTPException(
                status_code=400,
                detail="Failed to get user from Supabase token"
            )
        
        # Generate our JWT token
        jwt_token = create_access_token({"sub": str(user.id), "role": user.role})
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "subscription_tier": user.subscription_tier,
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase callback failed: {str(e)}"
        )



# ============ GOOGLE OAUTH ============
from fastapi import Request
import os

@router.get("/google/config", tags=["Google OAuth"])
def get_google_config_endpoint():
    """Get Google OAuth configuration for frontend."""
    # Try both hardcoded and settings object
    hardcoded_client_id = "978317573587-1256h4f6t230i1lol9it4qjk0315dgrj.apps.googleusercontent.com"
    settings_client_id = settings.GOOGLE_CLIENT_ID or ""
    # Use settings if available, otherwise use hardcoded
    client_id = settings_client_id if settings_client_id else hardcoded_client_id
    redirect_uri = "http://localhost:8000/auth/google/callback"
    is_configured = bool(client_id and client_id.strip())
    return {
        "configured": is_configured,
        "client_id": client_id if is_configured else None,
        "redirect_uri": redirect_uri if is_configured else None,
        "auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=openid+email+profile" if is_configured else None
    }


# ============ LINKEDIN OAUTH ============

@router.get("/linkedin/config", tags=["LinkedIn OAuth"])
def get_linkedin_config_endpoint():
    client_id = os.environ.get("LINKEDIN_CLIENT_ID", getattr(settings, "LINKEDIN_CLIENT_ID", ""))
    redirect_uri = os.environ.get("LINKEDIN_REDIRECT_URI", getattr(settings, "LINKEDIN_REDIRECT_URI", "http://localhost:8000/auth/linkedin/callback"))
    is_configured = bool(client_id and client_id.strip())
    auth_url = (
        f"https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope=r_liteprofile%20r_emailaddress"
        if is_configured else None
    )
    return {
        "configured": is_configured,
        "client_id": client_id if is_configured else None,
        "redirect_uri": redirect_uri if is_configured else None,
        "auth_url": auth_url
    }


@router.post("/linkedin/callback", tags=["LinkedIn OAuth"])
def linkedin_callback(code: str = Query(...), db: Session = Depends(get_db)):
    client_id = os.environ.get("LINKEDIN_CLIENT_ID", getattr(settings, "LINKEDIN_CLIENT_ID", ""))
    client_secret = os.environ.get("LINKEDIN_CLIENT_SECRET", getattr(settings, "LINKEDIN_CLIENT_SECRET", ""))
    redirect_uri = os.environ.get("LINKEDIN_REDIRECT_URI", getattr(settings, "LINKEDIN_REDIRECT_URI", "http://localhost:8000/auth/linkedin/callback"))
    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="LinkedIn OAuth not configured on server")
    try:
        # Exchange code for access token
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret,
        }
        response = requests.post(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        tokens = response.json()
        access_token = tokens.get("access_token")
        # Get user info
        userinfo_url = "https://api.linkedin.com/v2/me"
        email_url = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))"
        headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        email_response = requests.get(email_url, headers=headers)
        if userinfo_response.status_code != 200 or email_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch LinkedIn user info")
        user_info = userinfo_response.json()
        email_info = email_response.json()
        email = email_info['elements'][0]['handle~']['emailAddress']
        name = user_info.get('localizedFirstName', '') + user_info.get('localizedLastName', '')
        username = (name or email.split("@")[0]).lower().replace(" ", "_")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                username=username,
                password_hash="linkedin_oauth",
                role="analyst",
                subscription_tier="free",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")
        jwt_token = create_access_token({"sub": str(user.id), "role": user.role})
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "subscription_tier": user.subscription_tier,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LinkedIn OAuth failed: {str(e)}")


# ============ X (TWITTER) OAUTH ============

@router.get("/x/config", tags=["X OAuth"])
def get_x_config_endpoint():
    client_id = os.environ.get("X_CLIENT_ID", getattr(settings, "X_CLIENT_ID", ""))
    redirect_uri = os.environ.get("X_REDIRECT_URI", getattr(settings, "X_REDIRECT_URI", "http://localhost:8000/auth/x/callback"))
    is_configured = bool(client_id and client_id.strip())
    auth_url = (
        f"https://twitter.com/i/oauth2/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope=tweet.read%20users.read%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain"
        if is_configured else None
    )
    return {
        "configured": is_configured,
        "client_id": client_id if is_configured else None,
        "redirect_uri": redirect_uri if is_configured else None,
        "auth_url": auth_url
    }

@router.post("/x/callback", tags=["X OAuth"])
def x_callback(code: str = Query(...), db: Session = Depends(get_db)):
    client_id = os.environ.get("X_CLIENT_ID", getattr(settings, "X_CLIENT_ID", ""))
    client_secret = os.environ.get("X_CLIENT_SECRET", getattr(settings, "X_CLIENT_SECRET", ""))
    redirect_uri = os.environ.get("X_REDIRECT_URI", getattr(settings, "X_REDIRECT_URI", "http://localhost:8000/auth/x/callback"))
    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="X OAuth not configured on server")
    try:
        # Exchange code for access token
        token_url = "https://api.twitter.com/2/oauth2/token"
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret,
        }
        response = requests.post(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        tokens = response.json()
        access_token = tokens.get("access_token")
        # Get user info (Twitter API v2)
        userinfo_url = "https://api.twitter.com/2/users/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch X user info")
        user_info = userinfo_response.json()
        email = user_info.get('data', {}).get('username', '') + '@x.com'
        name = user_info.get('data', {}).get('name', '')
        username = (name or email.split("@")[0]).lower().replace(" ", "_")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                username=username,
                password_hash="x_oauth",
                role="analyst",
                subscription_tier="free",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")
        jwt_token = create_access_token({"sub": str(user.id), "role": user.role})
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "subscription_tier": user.subscription_tier,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"X OAuth failed: {str(e)}")


@router.post("/google/callback", tags=["Google OAuth"])
def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    """Handle Google OAuth callback and return JWT token."""
    
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=400,
            detail="Google OAuth not configured on server"
        )
    
    try:
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        response = requests.post(token_url, data=data)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        
        tokens = response.json()
        access_token = tokens.get("access_token")
        
        # Get user info from Google
        userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        userinfo_response = requests.get(userinfo_url, headers=headers)
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user info")
        
        user_info = userinfo_response.json()
        email = user_info.get("email")
        name = user_info.get("name", email.split("@")[0])
        
        # Find or create user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Auto-create user from Google info
            username = name.lower().replace(" ", "_") or email.split("@")[0]
            
            # Ensure unique username
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                username = f"{username}_{email.split('@')[0]}"
            
            user = User(
                email=email,
                username=username,
                password_hash="google_oauth",  # OAuth users don't have password
                role="analyst",
                subscription_tier="free",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")
        
        # Generate JWT token
        jwt_token = create_access_token({"sub": str(user.id), "role": user.role})
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "subscription_tier": user.subscription_tier,
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google OAuth failed: {str(e)}"
        )


