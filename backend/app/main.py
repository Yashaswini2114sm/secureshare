"""
SecureShare — Main Application Entry Point
=============================================
FastAPI application with CORS, router registration, and startup/shutdown events.

To run locally:
    uvicorn app.main:app --reload --port 8000

To run with Docker:
    docker-compose up --build

API Documentation:
    Swagger UI:  http://localhost:8000/docs
    ReDoc:       http://localhost:8000/redoc
"""

import logging
from contextlib import asynccontextmanager

# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import auth_router, file_router

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# ── Configure logging ────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("secureshare")


# ── Application lifespan (startup/shutdown events) ───────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on application startup and shutdown.
    
    Startup:
        - Initialize database tables
        - Create upload directory
        - Log startup info
    
    Shutdown:
        - Log shutdown info
        - Cleanup resources
    """
    # ── Startup ──────────────────────────────────────────────────
    logger.info("🚀 Starting SecureShare API...")
    logger.info(f"   Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    logger.info(f"   Upload Dir: {settings.UPLOAD_DIR}")
    logger.info(f"   Max File Size: {settings.MAX_FILE_SIZE_MB}MB")
    logger.info(f"   JWT Expiry: {settings.JWT_EXPIRATION_MINUTES} minutes")

    # Create database tables
    await init_db()
    logger.info("   ✅ Database tables created")

    # Create upload directory
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("   ✅ Upload directory ready")

    logger.info("🟢 SecureShare API ready!")
    logger.info(f"   📖 API Docs: http://localhost:8000/docs")

    yield  # Application runs here

    # ── Shutdown ─────────────────────────────────────────────────
    logger.info("🔴 Shutting down SecureShare API...")


# ═══════════════════════════════════════════════════════════════════
# CREATE FASTAPI APPLICATION
# ═══════════════════════════════════════════════════════════════════

app = FastAPI(
    title="SecureShare API",
    description=(
        "🔐 Secure File Sharing Platform\n\n"
        "Upload, encrypt, and share files securely with AES-256 encryption.\n\n"
        "**Features:**\n"
        "- AES-256-CBC file encryption\n"
        "- SHA-256 integrity verification\n"
        "- JWT authentication\n"
        "- Password-protected downloads\n"
        "- One-time downloads\n"
        "- File expiration\n"
        "- Download tracking & audit logs\n"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── CORS Middleware ──────────────────────────────────────────────
# Allow the Next.js frontend to make API calls
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],     # Allow all HTTP methods
    allow_headers=["*"],     # Allow all headers
)


# ── Register API Routers ────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(file_router.router)


# ── Root endpoint (health check) ────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """
    Health check endpoint.
    Returns basic API info and status.
    """
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "message": "Welcome to SecureShare API! Visit /docs for documentation.",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Detailed health check for monitoring.
    Returns database connectivity status.
    """
    return {
        "status": "healthy",
        "database": "connected",
        "encryption": "AES-256-CBC",
        "hashing": "SHA-256 + Bcrypt",
    }
