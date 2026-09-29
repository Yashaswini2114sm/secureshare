"""
SecureShare Auth Router
========================
Handles user registration, login, and profile retrieval.

Endpoints:
    POST /api/auth/register  — Create new user account
    POST /api/auth/login     — Authenticate and get JWT token
    GET  /api/auth/me        — Get current user profile (protected)
"""

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy import select
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import User
from app.schemas import (
    MessageResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with username, email, and password.",
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    Register a new user account.
    
    Steps:
        1. Check if username already exists
        2. Check if email already exists
        3. Hash the password with Bcrypt
        4. Create user record in database
        5. Return success message
    
    Raises:
        400: Username or email already taken
    """
    # Step 1: Check if username already exists
    existing_user = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # Step 2: Check if email already exists
    existing_email = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Step 3: Hash password (Bcrypt — irreversible, secure)
    hashed = hash_password(user_data.password)

    # Step 4: Create user record
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed,
    )
    db.add(new_user)
    await db.flush()  # Ensure user is persisted before response

    return MessageResponse(
        message=f"User '{user_data.username}' registered successfully",
        success=True,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get JWT token",
    description="Authenticate with username/password and receive a JWT access token.",
)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate user and issue JWT token.
    
    Steps:
        1. Find user by username in database
        2. Verify password against stored Bcrypt hash
        3. Create JWT token with user info
        4. Return token + user profile
    
    Raises:
        401: Invalid username or password
    """
    # Step 1: Find user by username
    result = await db.execute(
        select(User).where(User.username == credentials.username)
    )
    user = result.scalar_one_or_none()

    # Step 2: Verify password (constant-time comparison via Bcrypt)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 3: Create JWT token
    access_token = create_access_token(data={"sub": user.username})

    # Step 4: Return token and user info
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the profile of the currently authenticated user.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Get the currently authenticated user's profile.
    
    Requires: Valid JWT token in Authorization header.
    
    Returns:
        User profile (id, username, email, created_at)
    """
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
    )
