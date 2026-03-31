"""Pytest configuration and fixtures for Trust Sense backend."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app
from app.core.database import Base, get_db
from app.models.models import User
from app.core.security import get_password_hash


@pytest.fixture
def db_engine():
    """Create in-memory SQLite database for each test session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine):
    """Create a fresh database session for each test with automatic cleanup."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    
    yield session
    
    # Cleanup: rollback and close
    session.rollback()
    session.close()
    
    # Drop all tables after each test to reset state
    Base.metadata.drop_all(bind=db_engine)
    Base.metadata.create_all(bind=db_engine)


@pytest.fixture
def client(db_session: Session):
    """Create test client with dependency override."""
    
    def override_get_db():
        return db_session
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user in the database."""
    user = User(
        email="test@example.com",
        username="testuser",
        password_hash=get_password_hash("testpass123"),
        role="analyst",
        subscription_tier="free",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_admin(db_session: Session):
    """Create a test admin user."""
    admin = User(
        email="admin@example.com",
        username="adminuser",
        password_hash=get_password_hash("adminpass123"),
        role="admin",
        subscription_tier="enterprise",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin
