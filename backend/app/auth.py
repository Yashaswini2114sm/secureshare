"""
SecureShare Authentication Module
===================================
Handles JWT token creation/verification and password hashing.

Security Flow:
    1. User registers → password hashed with Bcrypt → stored in DB
    2. User logs in → password verified against hash → JWT issued
    3. Every API request → JWT verified → user identity confirmed

Components:
    - Bcrypt:  One-way password hashing (irreversible)
    - JWT:     Stateless authentication tokens (expire after 1 hour)
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
# pyrefly: ignore [missing-import]
from passlib.context import CryptContext
# pyrefly: ignore [missing-import]
from sqlalchemy import select
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import User


# ── Password hashing context ────────────────────────────────────
# Uses Bcrypt algorithm with automatic salt generation
# Bcrypt is intentionally slow to prevent brute-force attacks
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── OAuth2 scheme for JWT extraction from Authorization header ──
# Expects: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ═══════════════════════════════════════════════════════════════════
# PASSWORD FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    """
    Hash a plaintext password using Bcrypt.
    
    How it works:
        1. Generate random salt (unique per password)
        2. Combine password + salt
        3. Run through Bcrypt algorithm (intentionally slow)
        4. Return hash string (contains salt + hash)
    
    Args:
        password: The plaintext password to hash
        
    Returns:
        Bcrypt hash string (e.g., "$2b$12$LJ3m4...")
        
    Example:
        >>> hash_password("SecurePass123")
        "$2b$12$LJ3m4YZ..."
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against a Bcrypt hash.
    
    How it works:
        1. Extract salt from stored hash
        2. Hash the input password with same salt
        3. Compare the two hashes
        4. Return True if they match
    
    Args:
        plain_password:  The password the user just typed
        hashed_password: The hash stored in the database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


# ═══════════════════════════════════════════════════════════════════
# JWT TOKEN FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token.
    
    Token structure (before encoding):
        {
            "sub": "username",           # Subject (who the token is for)
            "exp": 1234567890            # Expiration time (Unix timestamp)
        }
    
    The token is signed with JWT_SECRET_KEY using HS256 algorithm.
    Anyone with the secret key can verify the token is authentic.
    
    Args:
        data: Dictionary of claims to encode (must include "sub")
        expires_delta: Custom expiration time (default: from settings)
        
    Returns:
        Encoded JWT string
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_EXPIRATION_MINUTES
        )
    
    to_encode.update({"exp": expire})
    
    # Sign and encode the token
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """
    Verify and decode a JWT token.
    
    Checks:
        1. Token signature is valid (not tampered with)
        2. Token has not expired
        3. Token contains a "sub" (subject) claim
    
    Args:
        token: The JWT string to verify
        
    Returns:
        Username (subject) if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        username: Optional[str] = payload.get("sub")
        return username
    except JWTError:
        return None


# ═══════════════════════════════════════════════════════════════════
# FASTAPI DEPENDENCY: Get Current User
# ═══════════════════════════════════════════════════════════════════

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that extracts and verifies the current user.
    
    Flow:
        1. Extract JWT from Authorization header
        2. Decode and verify the token
        3. Look up the user in the database
        4. Return the User object (or raise 401 error)
    
    Usage in endpoints:
        @router.get("/protected")
        async def protected_route(user: User = Depends(get_current_user)):
            return {"message": f"Hello, {user.username}!"}
    
    Raises:
        HTTPException 401: If token is invalid, expired, or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Step 1: Verify the token and extract username
    username = verify_token(token)
    if username is None:
        raise credentials_exception
    
    # Step 2: Look up user in database
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user
