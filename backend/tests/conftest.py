"""
SecureShare Test Configuration
================================
Shared fixtures for all test modules.
"""

import asyncio
import os
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
import pytest_asyncio
# pyrefly: ignore [missing-import]
from httpx import AsyncClient, ASGITransport
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# Set test database BEFORE importing app modules
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_secureshare.db"
os.environ["UPLOAD_DIR"] = "./test_uploads"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only"

from app.main import app
from app.database import Base, get_db


# ── Test database engine ─────────────────────────────────────────
test_engine = create_async_engine(
    "sqlite+aiosqlite:///./test_secureshare.db",
    connect_args={"check_same_thread": False},
)

test_session = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Override database dependency ─────────────────────────────────
async def override_get_db():
    async with test_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

app.dependency_overrides[get_db] = override_get_db


# ── Fixtures ─────────────────────────────────────────────────────
@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Clean up test files
    import shutil
    if os.path.exists("./test_uploads"):
        shutil.rmtree("./test_uploads")
    if os.path.exists("./test_secureshare.db"):
        os.remove("./test_secureshare.db")


@pytest_asyncio.fixture
async def client():
    """Async HTTP client for testing FastAPI endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient):
    """Register a test user and return auth headers with JWT token."""
    # Register user
    await client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123",
    })
    # Login to get token
    response = await client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "TestPass123",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
