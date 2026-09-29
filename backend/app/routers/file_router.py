"""
SecureShare File Router
========================
Handles file upload, download, listing, and deletion.

Security layers applied per request:
    1. JWT authentication (who is making the request?)
    2. Authorization (does the user own this file?)
    3. Access control (password, expiration, one-time, download limit)
    4. Encryption/Decryption (AES-256-CBC)
    5. Integrity verification (SHA-256 hash check)
    6. Audit logging (who downloaded what, when, from where)

Endpoints:
    POST   /api/files/upload        — Upload and encrypt a file
    GET    /api/files/               — List current user's files
    GET    /api/files/{file_id}      — Get file metadata
    GET    /api/files/{file_id}/download — Download and decrypt a file
    DELETE /api/files/{file_id}      — Delete a file
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
# pyrefly: ignore [missing-import]
from fastapi.responses import Response
# pyrefly: ignore [missing-import]
from sqlalchemy import select
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import selectinload

from app.auth import get_current_user, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.encryption import (
    calculate_file_hash,
    decrypt_file,
    encrypt_file,
    generate_encryption_key,
    verify_file_integrity,
    perform_ecdh_key_exchange,
)
from app.models import DownloadLog, File as FileModel, User
from app.schemas import (
    FileDeleteResponse,
    FileDetailResponse,
    FileListResponse,
    FileUploadResponse,
)

router = APIRouter(prefix="/api/files", tags=["Files"])


# ═══════════════════════════════════════════════════════════════════
# UPLOAD FILE
# ═══════════════════════════════════════════════════════════════════

@router.post(
    "/upload",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and encrypt a file",
    description="Upload a file, encrypt it with AES-256, and store securely.",
)
async def upload_file(
    file: UploadFile = File(..., description="The file to upload"),
    password: Optional[str] = Form(None, description="Optional password protection"),
    expires_in_hours: Optional[int] = Form(
        None, description="Hours until file expires (0 = never)"
    ),
    is_one_time: bool = Form(False, description="Delete after first download"),
    max_downloads: int = Form(0, description="Max download count (0 = unlimited)"),
    is_public: bool = Form(True, description="Allow anyone with link to download"),
    client_public_key_hex: Optional[str] = Form(None, description="ECDH Public Key from client"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileUploadResponse:
    file_data = await file.read()
    file_size = len(file_data)

    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload empty file",
        )

    file_hash = calculate_file_hash(file_data)
    
    # ── Diffie-Hellman Key Exchange (ECDH) ───────────────────────
    if client_public_key_hex:
        encryption_key, server_pub_key = perform_ecdh_key_exchange(client_public_key_hex)
        _, encryption_iv = generate_encryption_key()  # Still need random IV
    else:
        encryption_key, encryption_iv = generate_encryption_key()
        server_pub_key = "N/A"

    encrypted_data = encrypt_file(file_data, encryption_key, encryption_iv)

    print("\n" + "="*70)
    print("🔒 SECURESHARE ECDH CRYPTOGRAPHY ENGINE 🔒")
    print("="*70)
    print(f"File Name: {file.filename}")
    print("-" * 70)
    if client_public_key_hex:
        print(f"[ECDH] Received Client PubKey: {client_public_key_hex[:30]}...")
        print(f"[ECDH] Generated Server PubKey: {server_pub_key[:30]}...")
        print(f"[ECDH] Derived Shared AES Key:  {encryption_key}")
    else:
        print(f"[AES] Generated Random AES Key: {encryption_key}")
    print(f"[AES] Generated AES-IV:         {encryption_iv}")
    print(f"[HASH] SHA-256 Fingerprint:     {file_hash}")
    print("-" * 70)
    print(f"Encrypted Ciphertext (first 50 bytes): {encrypted_data[:50].hex()}")
    print("="*70 + "\n")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    import uuid
    stored_filename = f"{uuid.uuid4().hex}_{file.filename}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    with open(stored_path, "wb") as f:
        f.write(encrypted_data)

    # Step 7: Hash optional password (if provided)
    password_hash = None
    if password:
        password_hash = hash_password(password)

    # Calculate expiration time
    expires_at = None
    if expires_in_hours and expires_in_hours > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)

    # Step 8: Create database record
    file_record = FileModel(
        original_filename=file.filename or "unnamed_file",
        stored_path=stored_path,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        encryption_key=encryption_key,
        encryption_iv=encryption_iv,
        file_hash=file_hash,
        owner_id=current_user.id,
        password_hash=password_hash,
        expires_at=expires_at,
        is_one_time=is_one_time,
        max_downloads=max_downloads,
        is_public=is_public,
    )
    db.add(file_record)
    await db.flush()
    await db.refresh(file_record)

    crypto_logs = {
        "client_pub_key": client_public_key_hex if client_public_key_hex else "N/A (Generated random key)",
        "server_pub_key": server_pub_key,
        "derived_aes_key": encryption_key,
        "aes_iv": encryption_iv,
        "sha256_hash": file_hash,
        "ciphertext_sample": encrypted_data[:50].hex()
    }

    # Step 9: Return response with file_id for sharing
    return FileUploadResponse(
        file_id=file_record.file_id,
        original_filename=file_record.original_filename,
        file_size=file_record.file_size,
        mime_type=file_record.mime_type,
        download_url=f"/api/files/{file_record.file_id}/download",
        expires_at=file_record.expires_at,
        is_one_time=file_record.is_one_time,
        is_public=file_record.is_public,
        created_at=file_record.created_at,
        message="File uploaded and encrypted successfully",
        crypto_logs=crypto_logs,
    )


# ═══════════════════════════════════════════════════════════════════
# LIST USER'S FILES
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/",
    response_model=FileListResponse,
    summary="List your uploaded files",
    description="Get a list of all files uploaded by the current user.",
)
async def list_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileListResponse:
    """
    List all files owned by the current user.
    
    Returns file metadata (never encryption keys).
    Expired files are excluded from the list.
    """
    # Query files owned by current user, ordered by newest first
    result = await db.execute(
        select(FileModel)
        .where(FileModel.owner_id == current_user.id)
        .order_by(FileModel.created_at.desc())
    )
    files = result.scalars().all()

    # Filter out expired files and build response
    file_list = []
    for f in files:
        # Skip expired files
        if f.expires_at and f.expires_at < datetime.now(timezone.utc):
            continue

        file_list.append(
            FileDetailResponse(
                file_id=f.file_id,
                original_filename=f.original_filename,
                file_size=f.file_size,
                mime_type=f.mime_type,
                download_url=f"/api/files/{f.file_id}/download",
                expires_at=f.expires_at,
                is_one_time=f.is_one_time,
                is_downloaded=f.is_downloaded,
                download_count=f.download_count,
                max_downloads=f.max_downloads,
                is_public=f.is_public,
                created_at=f.created_at,
                owner=current_user.username,
            )
        )

    return FileListResponse(files=file_list, total=len(file_list))


# ═══════════════════════════════════════════════════════════════════
# GET FILE METADATA
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{file_id}",
    response_model=FileDetailResponse,
    summary="Get file metadata",
    description="Get metadata for a specific file (does not include encryption keys).",
)
async def get_file_info(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileDetailResponse:
    """
    Get metadata for a specific file.
    
    Access control:
        - File owner can always see metadata
        - Public files: anyone authenticated can see metadata
        - Private files: only owner can see metadata
    """
    # Find file by public file_id
    result = await db.execute(
        select(FileModel)
        .options(selectinload(FileModel.owner))
        .where(FileModel.file_id == file_id)
    )
    file_record = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # Check authorization for private files
    if not file_record.is_public and file_record.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this file",
        )

    # Check if file has expired
    if file_record.expires_at and file_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This file has expired and is no longer available",
        )

    return FileDetailResponse(
        file_id=file_record.file_id,
        original_filename=file_record.original_filename,
        file_size=file_record.file_size,
        mime_type=file_record.mime_type,
        download_url=f"/api/files/{file_record.file_id}/download",
        expires_at=file_record.expires_at,
        is_one_time=file_record.is_one_time,
        is_downloaded=file_record.is_downloaded,
        download_count=file_record.download_count,
        max_downloads=file_record.max_downloads,
        is_public=file_record.is_public,
        created_at=file_record.created_at,
        owner=file_record.owner.username,
    )


# ═══════════════════════════════════════════════════════════════════
# DOWNLOAD FILE
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{file_id}/download",
    summary="Download and decrypt a file",
    description="Download a file. Decrypts on-the-fly and verifies integrity.",
)
async def download_file(
    file_id: str,
    password: Optional[str] = Query(None, description="File password if required"),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
) -> Response:
    result = await db.execute(select(FileModel).where(FileModel.file_id == file_id))
    file_record = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    if file_record.expires_at and file_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="File has expired")

    if file_record.password_hash:
        if not password:
            raise HTTPException(status_code=401, detail="Password required")
        if not verify_password(password, file_record.password_hash):
            raise HTTPException(status_code=401, detail="Incorrect password")

    if file_record.max_downloads > 0 and file_record.download_count >= file_record.max_downloads:
        raise HTTPException(status_code=403, detail="Download limit reached")

    if file_record.is_one_time and file_record.is_downloaded:
        raise HTTPException(status_code=403, detail="One-time download already used")

    if not os.path.exists(file_record.stored_path):
        raise HTTPException(status_code=404, detail="File missing from disk")

    with open(file_record.stored_path, "rb") as f:
        encrypted_data = f.read()

    try:
        decrypted_data = decrypt_file(
            encrypted_data,
            file_record.encryption_key,
            file_record.encryption_iv,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt file. The file may be corrupted.",
        )

    if not verify_file_integrity(decrypted_data, file_record.file_hash):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File integrity check failed. The file may have been tampered with.",
        )

    file_record.download_count += 1
    if file_record.is_one_time:
        file_record.is_downloaded = True

    client_ip = request.client.host if request and request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    download_log = DownloadLog(
        file_id=file_record.id,
        downloaded_by="link_visitor",
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(download_log)
    await db.flush()

    return Response(
        content=decrypted_data,
        media_type=file_record.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_record.original_filename}"',
            "Content-Length": str(len(decrypted_data)),
            "X-File-Hash": file_record.file_hash,
        },
    )


# ═══════════════════════════════════════════════════════════════════
# DELETE FILE
# ═══════════════════════════════════════════════════════════════════

@router.delete(
    "/{file_id}",
    response_model=FileDeleteResponse,
    summary="Delete a file",
    description="Delete a file and its encrypted data from disk.",
)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileDeleteResponse:
    """
    Delete a file (only the owner can delete).
    
    Steps:
        1. Find file in database
        2. Verify current user is the owner
        3. Delete encrypted file from disk
        4. Delete database record (cascades to download logs)
    """
    # Step 1: Find file
    result = await db.execute(
        select(FileModel).where(FileModel.file_id == file_id)
    )
    file_record = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # Step 2: Verify ownership
    if file_record.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this file",
        )

    # Step 3: Secure File Shredding (Overwrite with random bytes before deletion)
    if os.path.exists(file_record.stored_path):
        try:
            file_size_on_disk = os.path.getsize(file_record.stored_path)
            with open(file_record.stored_path, "r+b") as f:
                f.write(os.urandom(file_size_on_disk))
                f.flush()
                os.fsync(f.fileno())
        except Exception as e:
            print(f"Shredding error (non-fatal): {e}")
        os.remove(file_record.stored_path)

    # Step 4: Delete database record (cascade deletes download logs)
    await db.delete(file_record)
    await db.flush()

    return FileDeleteResponse(
        message="File deleted successfully",
        file_id=file_id,
    )
