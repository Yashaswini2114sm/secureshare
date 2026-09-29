"""
SecureShare Auth Tests
========================
Tests for user registration, login, and profile endpoints.
"""

# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test successful user registration."""
    response = await client.post("/api/auth/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "SecurePass123",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "newuser" in data["message"]


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient):
    """Test that duplicate usernames are rejected."""
    # Register first user
    await client.post("/api/auth/register", json={
        "username": "duplicate",
        "email": "first@example.com",
        "password": "SecurePass123",
    })
    # Try to register with same username
    response = await client.post("/api/auth/register", json={
        "username": "duplicate",
        "email": "second@example.com",
        "password": "SecurePass123",
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that duplicate emails are rejected."""
    await client.post("/api/auth/register", json={
        "username": "user1",
        "email": "same@example.com",
        "password": "SecurePass123",
    })
    response = await client.post("/api/auth/register", json={
        "username": "user2",
        "email": "same@example.com",
        "password": "SecurePass123",
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    """Test that invalid email format is rejected."""
    response = await client.post("/api/auth/register", json={
        "username": "baduser",
        "email": "not-an-email",
        "password": "SecurePass123",
    })
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    """Test that short passwords are rejected (min 6 chars)."""
    response = await client.post("/api/auth/register", json={
        "username": "shortpw",
        "email": "short@example.com",
        "password": "12345",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login returns JWT token."""
    # Register
    await client.post("/api/auth/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "SecurePass123",
    })
    # Login
    response = await client.post("/api/auth/login", json={
        "username": "loginuser",
        "password": "SecurePass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "loginuser"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Test that wrong password returns 401."""
    await client.post("/api/auth/register", json={
        "username": "wrongpw",
        "email": "wrong@example.com",
        "password": "SecurePass123",
    })
    response = await client.post("/api/auth/login", json={
        "username": "wrongpw",
        "password": "WrongPassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test that login with nonexistent user returns 401."""
    response = await client.post("/api/auth/login", json={
        "username": "noexist",
        "password": "SecurePass123",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_profile(client: AsyncClient, auth_headers: dict):
    """Test getting current user profile with valid JWT."""
    response = await client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_profile_no_token(client: AsyncClient):
    """Test that profile endpoint rejects requests without JWT."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_profile_invalid_token(client: AsyncClient):
    """Test that profile endpoint rejects invalid JWT."""
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid-token-here"},
    )
    assert response.status_code == 401
