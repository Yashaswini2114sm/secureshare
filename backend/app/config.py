"""
SecureShare Configuration Module
================================
Loads application settings from environment variables using Pydantic Settings.
Supports both PostgreSQL (production/Docker) and SQLite (local development).
"""

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from .env file or environment variables.
    
    Attributes:
        APP_NAME: Display name of the application
        DEBUG: Enable debug mode (extra logging, detailed errors)
        
        DATABASE_URL: Primary database connection string
            - PostgreSQL: postgresql+asyncpg://user:pass@host:port/dbname
            - SQLite:     sqlite+aiosqlite:///./secureshare.db
        
        JWT_SECRET_KEY: Secret key for signing JWT tokens (CHANGE IN PRODUCTION!)
        JWT_ALGORITHM: Algorithm for JWT encoding (default: HS256)
        JWT_EXPIRATION_MINUTES: Token expiry time in minutes (default: 60)
        
        UPLOAD_DIR: Directory path for storing encrypted files
        MAX_FILE_SIZE_MB: Maximum allowed upload size in megabytes
        
        CORS_ORIGINS: Comma-separated list of allowed frontend origins
    """

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "SecureShare"
    DEBUG: bool = False

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./secureshare.db"

    # ── JWT Authentication ───────────────────────────────────────
    JWT_SECRET_KEY: str = "super-secret-key-change-in-production-abc123"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60

    # ── File Storage ─────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 100

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance — import this anywhere in the app
settings = Settings()
