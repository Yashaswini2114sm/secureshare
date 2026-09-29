"""
SecureShare Auth Router
========================
Handles user registration, login, and profile retrieval.

Endpoints:
    POST /api/auth/register  — Create new user account
    POST /api/auth/login     — Authenticate and get JWT token
    GET  /api/auth/me        — Get current user profile (protected)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
# pyrefly: ignore [missing-import]
from sqlalchemy import select
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
import pyotp

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import User, AuditLog
from app.schemas import (
    MessageResponse,
    RegisterResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with username, email, and password.",
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
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

    # Step 4: Create user record and 2FA secret
    totp_secret = pyotp.random_base32()
    otpauth_url = pyotp.totp.TOTP(totp_secret).provisioning_uri(
        name=user_data.email, issuer_name="SecureShare"
    )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed,
        totp_secret=totp_secret,
        is_2fa_enabled=True,
    )
    db.add(new_user)
    await db.flush()  # Ensure user is persisted before response

    return RegisterResponse(
        message=f"User '{user_data.username}' registered successfully. Please scan the QR code to set up 2FA.",
        success=True,
        totp_secret=totp_secret,
        otpauth_url=otpauth_url,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get JWT token",
    description="Authenticate with username/password and receive a JWT access token.",
)
@limiter.limit("5/minute")
async def login(
    request: Request,
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
        # Log failure
        log = AuditLog(action="LOGIN_FAILED", ip_address=request.client.host, user_agent=request.headers.get("user-agent"))
        db.add(log)
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 2.5: Verify 2FA TOTP code
    if user.is_2fa_enabled:
        if not credentials.totp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA code is required",
            )
        totp = pyotp.totp.TOTP(user.totp_secret)
        if not totp.verify(credentials.totp_code):
            log = AuditLog(user_id=user.id, action="2FA_FAILED", ip_address=request.client.host, user_agent=request.headers.get("user-agent"))
            db.add(log)
            await db.flush()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA code",
            )

    # Step 3: Create JWT token
    access_token = create_access_token(data={"sub": user.username})
    
    # Log success
    log = AuditLog(user_id=user.id, action="LOGIN_SUCCESS", ip_address=request.client.host, user_agent=request.headers.get("user-agent"))
    db.add(log)
    await db.flush()

    # Step 4: Return token and user info
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_2fa_enabled=user.is_2fa_enabled,
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
        is_2fa_enabled=current_user.is_2fa_enabled,
        created_at=current_user.created_at,
    )
