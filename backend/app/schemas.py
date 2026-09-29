"""
SecureShare Pydantic Schemas
==============================
Request and response models for API validation.

Pydantic automatically:
- Validates input data types
- Returns clear error messages for invalid data
- Generates OpenAPI/Swagger documentation
"""

from datetime import datetime
from typing import Optional, List

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field


# ═══════════════════════════════════════════════════════════════════
# AUTH SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class UserCreate(BaseModel):
    """
    Request schema for user registration.
    
    Validations:
        - username: 3-50 characters
        - email: valid email format
        - password: minimum 6 characters
    """
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Unique username (3-50 characters)",
        examples=["johndoe"],
    )
    email: EmailStr = Field(
        ...,
        description="Valid email address",
        examples=["john@example.com"],
    )
    password: str = Field(
        ...,
        min_length=6,
        description="Password (minimum 6 characters)",
        examples=["SecurePass123"],
    )


class UserLogin(BaseModel):
    """Request schema for user login."""
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class UserResponse(BaseModel):
    """Response schema for user profile data."""
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """
    Response schema for successful login.
    Returns a JWT access token for subsequent API calls.
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer')")
    user: UserResponse = Field(..., description="Authenticated user profile")


# ═══════════════════════════════════════════════════════════════════
# FILE SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class FileUploadResponse(BaseModel):
    """
    Response schema after successful file upload.
    Contains the file_id needed for sharing/downloading.
    """
    file_id: str = Field(..., description="Unique file identifier for sharing")
    original_filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type of the file")
    download_url: str = Field(..., description="URL to download the file")
    expires_at: Optional[datetime] = Field(None, description="Expiration timestamp")
    is_one_time: bool = Field(False, description="Whether file deletes after first download")
    is_public: bool = Field(True, description="Whether file is publicly accessible")
    created_at: datetime = Field(..., description="Upload timestamp")
    message: str = Field(default="File uploaded and encrypted successfully")

    model_config = {"from_attributes": True}


class FileDetailResponse(BaseModel):
    """Response schema for file metadata (without encryption keys)."""
    file_id: str
    original_filename: str
    file_size: int
    mime_type: str
    download_url: str
    expires_at: Optional[datetime] = None
    is_one_time: bool = False
    is_downloaded: bool = False
    download_count: int = 0
    max_downloads: int = 0
    is_public: bool = True
    created_at: datetime
    owner: str = Field(..., description="Username of file owner")

    model_config = {"from_attributes": True}


class FileListResponse(BaseModel):
    """Response schema for listing user's files."""
    files: List[FileDetailResponse]
    total: int = Field(..., description="Total number of files")


class FileDownloadRequest(BaseModel):
    """Optional request body for password-protected downloads."""
    password: Optional[str] = Field(None, description="File password (if required)")


class FileDeleteResponse(BaseModel):
    """Response schema for file deletion."""
    message: str = "File deleted successfully"
    file_id: str


# ═══════════════════════════════════════════════════════════════════
# DOWNLOAD LOG SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class DownloadLogResponse(BaseModel):
    """Response schema for download audit log entries."""
    downloaded_by: str
    ip_address: Optional[str] = None
    downloaded_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════
# GENERIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class MessageResponse(BaseModel):
    """Generic message response for simple operations."""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Standard error response format."""
    detail: str
    error_code: Optional[str] = None
