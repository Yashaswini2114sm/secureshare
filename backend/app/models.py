"""
SecureShare Database Models
============================
Defines the three core database tables:

1. User    — Registered users with hashed passwords
2. File    — Uploaded files with encryption metadata  
3. DownloadLog — Audit trail of all file downloads

Relationships:
    User ──< File       (one user has many files)
    File ──< DownloadLog (one file has many download records)
"""

import uuid
from datetime import datetime, timezone

# pyrefly: ignore [missing-import]
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid() -> str:
    """Generate a short, URL-friendly unique identifier."""
    return str(uuid.uuid4())[:8]


class User(Base):
    """
    User account model.
    
    Stores registration info and hashed password.
    Never stores plaintext passwords (uses Bcrypt hashing).
    
    Columns:
        id            — Auto-increment primary key
        username      — Unique username (3-50 characters)
        email         — Unique email address
        hashed_password — Bcrypt hash of the password
        created_at    — Account creation timestamp (UTC)
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    totp_secret = Column(String(32), nullable=True)
    is_2fa_enabled = Column(Boolean, default=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship: User has many Files
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")


class File(Base):
    """
    Encrypted file metadata model.
    
    Stores everything needed to manage, decrypt, and serve a file.
    The actual encrypted file is stored on disk at `stored_path`.
    
    Columns:
        id              — Auto-increment primary key
        file_id         — Public-facing short UUID (e.g., "a1b2c3d4")
        original_filename — User's original filename (for download)
        stored_path     — Path to encrypted file on disk
        file_size       — Original file size in bytes
        mime_type       — MIME type of the original file
        encryption_key  — Hex-encoded AES-256 key (32 bytes = 64 hex chars)
        encryption_iv   — Hex-encoded initialization vector (16 bytes = 32 hex chars)
        file_hash       — SHA-256 hash of original file (integrity verification)
        owner_id        — Foreign key to users table
        password_hash   — Optional Bcrypt hash for password-protected downloads
        expires_at      — Optional expiration timestamp (UTC)
        is_one_time     — If True, file is deactivated after first download
        is_downloaded   — Tracks whether one-time file has been downloaded
        download_count  — Total number of times file has been downloaded
        max_downloads   — Optional download limit (0 = unlimited)
        is_public       — If True, anyone with link can download
        created_at      — Upload timestamp (UTC)
    """
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_id = Column(
        String(8), unique=True, nullable=False, index=True, default=generate_uuid
    )
    original_filename = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    mime_type = Column(String(100), default="application/octet-stream")

    # ── Encryption fields ────────────────────────────────────────
    encryption_key = Column(String(64), nullable=False)  # Hex-encoded AES key
    encryption_iv = Column(String(32), nullable=False)    # Hex-encoded IV
    file_hash = Column(String(64), nullable=False)        # SHA-256 fingerprint

    # ── Ownership ────────────────────────────────────────────────
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="files")

    # ── Access control ───────────────────────────────────────────
    password_hash = Column(String(255), nullable=True)    # Optional password protection
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_one_time = Column(Boolean, default=False)
    is_downloaded = Column(Boolean, default=False)
    download_count = Column(Integer, default=0)
    max_downloads = Column(Integer, default=0)            # 0 = unlimited
    is_public = Column(Boolean, default=True)

    # ── Timestamps ───────────────────────────────────────────────
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship: File has many DownloadLogs
    download_logs = relationship(
        "DownloadLog", back_populates="file", cascade="all, delete-orphan"
    )


class DownloadLog(Base):
    """
    Audit log for file downloads.
    
    Records every download attempt for security tracking.
    
    Columns:
        id            — Auto-increment primary key
        file_id       — Foreign key to files table
        downloaded_by — Username or 'anonymous' if public download
        ip_address    — Client IP address
        user_agent    — Client browser/app info
        downloaded_at — Download timestamp (UTC)
    """
    __tablename__ = "download_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    downloaded_by = Column(String(50), default="anonymous")
    ip_address = Column(String(45), nullable=True)        # IPv6 max length = 45
    user_agent = Column(String(500), nullable=True)
    downloaded_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship back to File
    file = relationship("File", back_populates="download_logs")


class AuditLog(Base):
    """
    Security Audit Log.
    
    Records every security event for compliance tracking.
    
    Columns:
        id         — Auto-increment primary key
        user_id    — Optional foreign key to users (if authenticated)
        action     — Event type (e.g. LOGIN_SUCCESS, FILE_UPLOADED)
        ip_address — Client IP address
        user_agent — Client browser/app info
        timestamp  — Event timestamp (UTC)
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

