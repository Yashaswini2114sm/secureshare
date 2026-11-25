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

from app.auth import (
    get_current_user,
    get_current_user_flexible,
    get_optional_user,
    hash_password,
    verify_password,
)
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
from app.models import AccessRequest, AuditLog, DownloadLog, File as FileModel, User
from app.schemas import (
    AccessRequestDetailResponse,
    FileAccessStatusResponse,
    FileDeleteResponse,
    FileDetailResponse,
    FileListResponse,
    FileUploadResponse,
    MessageResponse,
    OwnerAccessRequestsResponse,
)

router = APIRouter(prefix="/api/files", tags=["Files"])


def is_file_expired(expires_at: Optional[datetime]) -> bool:
    """Check if a file has expired, safely handling naive and aware datetimes."""
    if not expires_at:
        return False
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at < datetime.now(timezone.utc)


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

    # Audit Log
    upload_audit = AuditLog(
        user_id=current_user.id,
        action=f"FILE_UPLOADED:file_{file_record.file_id}",
        ip_address="127.0.0.1",
        user_agent="SecureShare Client",
    )
    db.add(upload_audit)
    await db.flush()

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
        if is_file_expired(f.expires_at):
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
    if is_file_expired(file_record.expires_at):
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
# ACCESS REQUEST MANAGEMENT (OWNER ENDPOINTS)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/access-requests/owner",
    response_model=OwnerAccessRequestsResponse,
    summary="Get all access requests for files owned by current user",
)
async def get_owner_access_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OwnerAccessRequestsResponse:
    """List all access requests for files owned by the authenticated user."""
    result = await db.execute(
        select(AccessRequest)
        .join(FileModel, AccessRequest.file_id == FileModel.id)
        .options(selectinload(AccessRequest.file), selectinload(AccessRequest.requester))
        .where(FileModel.owner_id == current_user.id)
        .order_by(AccessRequest.created_at.desc())
    )
    requests = result.scalars().all()

    request_items = [
        AccessRequestDetailResponse(
            id=r.id,
            file_id=r.file.file_id,
            original_filename=r.file.original_filename,
            requester_id=r.user_id,
            requester_username=r.requester.username,
            requester_email=r.requester.email,
            status=r.status,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in requests
    ]
    total_pending = sum(1 for r in requests if r.status == "PENDING")

    return OwnerAccessRequestsResponse(
        requests=request_items,
        total_pending=total_pending,
        total=len(request_items),
    )


@router.post(
    "/access-requests/{request_id}/approve",
    response_model=MessageResponse,
    summary="Approve an access request",
)
async def approve_access_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Approve a recipient's request to access a file."""
    result = await db.execute(
        select(AccessRequest)
        .options(selectinload(AccessRequest.file), selectinload(AccessRequest.requester))
        .where(AccessRequest.id == request_id)
    )
    access_req = result.scalar_one_or_none()
    if not access_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")

    if access_req.file.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the file owner can approve requests",
        )

    access_req.status = "APPROVED"
    access_req.updated_at = datetime.now(timezone.utc)

    client_ip = request.client.host if request and request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    audit = AuditLog(
        user_id=current_user.id,
        action=f"ACCESS_APPROVED:req_{access_req.id}:file_{access_req.file.file_id}:user_{access_req.user_id}",
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(audit)
    await db.flush()

    return MessageResponse(message="Access request approved successfully", success=True)


@router.post(
    "/access-requests/{request_id}/reject",
    response_model=MessageResponse,
    summary="Reject an access request",
)
async def reject_access_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Reject a recipient's request to access a file."""
    result = await db.execute(
        select(AccessRequest)
        .options(selectinload(AccessRequest.file), selectinload(AccessRequest.requester))
        .where(AccessRequest.id == request_id)
    )
    access_req = result.scalar_one_or_none()
    if not access_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")

    if access_req.file.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the file owner can reject requests",
        )

    access_req.status = "REJECTED"
    access_req.updated_at = datetime.now(timezone.utc)

    client_ip = request.client.host if request and request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    audit = AuditLog(
        user_id=current_user.id,
        action=f"ACCESS_REJECTED:req_{access_req.id}:file_{access_req.file.file_id}:user_{access_req.user_id}",
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(audit)
    await db.flush()

    return MessageResponse(message="Access request rejected", success=True)


@router.post(
    "/access-requests/{request_id}/revoke",
    response_model=MessageResponse,
    summary="Revoke previously granted access",
)
async def revoke_access_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Revoke previously granted access permission from a recipient."""
    result = await db.execute(
        select(AccessRequest)
        .options(selectinload(AccessRequest.file), selectinload(AccessRequest.requester))
        .where(AccessRequest.id == request_id)
    )
    access_req = result.scalar_one_or_none()
    if not access_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")

    if access_req.file.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the file owner can revoke access",
        )

    access_req.status = "REVOKED"
    access_req.updated_at = datetime.now(timezone.utc)

    client_ip = request.client.host if request and request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    audit = AuditLog(
        user_id=current_user.id,
        action=f"ACCESS_REVOKED:req_{access_req.id}:file_{access_req.file.file_id}:user_{access_req.user_id}",
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(audit)
    await db.flush()

    return MessageResponse(message="Access revoked successfully", success=True)


# ═══════════════════════════════════════════════════════════════════
# FILE ACCESS STATUS & REQUEST ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{file_id}/access-status",
    response_model=FileAccessStatusResponse,
    summary="Get access status for a file",
    description="Check whether caller is owner, has pending/approved/rejected request, or needs to request access.",
)
async def get_file_access_status(
    file_id: str,
    request: Request,
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> FileAccessStatusResponse:
    result = await db.execute(
        select(FileModel).options(selectinload(FileModel.owner)).where(FileModel.file_id == file_id)
    )
    file_record = result.scalar_one_or_none()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    expired = is_file_expired(file_record.expires_at)
    is_owner = False
    access_status = "NONE"
    is_auth = False

    if user:
        is_auth = True
        if user.id == file_record.owner_id:
            is_owner = True
            access_status = "APPROVED"
        else:
            req_result = await db.execute(
                select(AccessRequest).where(
                    AccessRequest.file_id == file_record.id,
                    AccessRequest.user_id == user.id,
                )
            )
            req = req_result.scalar_one_or_none()
            if req:
                access_status = req.status
            else:
                access_status = "NONE"

    return FileAccessStatusResponse(
        file_id=file_record.file_id,
        original_filename=file_record.original_filename,
        file_size=file_record.file_size,
        mime_type=file_record.mime_type,
        owner=file_record.owner.username if file_record.owner else "Unknown",
        is_owner=is_owner,
        is_authenticated=is_auth,
        access_status=access_status,
        has_password=bool(file_record.password_hash),
        is_expired=expired,
        is_one_time=file_record.is_one_time,
        is_downloaded=file_record.is_downloaded,
        max_downloads=file_record.max_downloads,
        download_count=file_record.download_count,
    )


@router.post(
    "/{file_id}/request-access",
    response_model=MessageResponse,
    summary="Request access to a file",
    description="Recipient submits an access request to the file owner.",
)
async def request_file_access(
    file_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await db.execute(
        select(FileModel).options(selectinload(FileModel.owner)).where(FileModel.file_id == file_id)
    )
    file_record = result.scalar_one_or_none()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    if is_file_expired(file_record.expires_at):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="File has expired")

    if file_record.owner_id == current_user.id:
        return MessageResponse(message="You are the owner of this file", success=True)

    # Check existing request
    req_result = await db.execute(
        select(AccessRequest).where(
            AccessRequest.file_id == file_record.id,
            AccessRequest.user_id == current_user.id,
        )
    )
    access_req = req_result.scalar_one_or_none()

    if access_req:
        if access_req.status == "APPROVED":
            return MessageResponse(message="Access has already been approved", success=True)
        # Re-request if REJECTED, REVOKED, or renew PENDING
        access_req.status = "PENDING"
        access_req.updated_at = datetime.now(timezone.utc)
    else:
        access_req = AccessRequest(
            file_id=file_record.id,
            user_id=current_user.id,
            status="PENDING",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(access_req)

    client_ip = request.client.host if request and request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    audit = AuditLog(
        user_id=current_user.id,
        action=f"ACCESS_REQUESTED:file_{file_record.file_id}",
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(audit)
    await db.flush()

    return MessageResponse(message="Access request submitted successfully", success=True)


# ═══════════════════════════════════════════════════════════════════
# DOWNLOAD FILE
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{file_id}/download",
    summary="Download and decrypt a file",
    description="Download a file. Enforces owner or approved recipient authorization, decrypts on-the-fly and verifies integrity.",
)
async def download_file(
    file_id: str,
    request: Request,
    password: Optional[str] = Query(None, description="File password if required"),
    current_user: User = Depends(get_current_user_flexible),
    db: AsyncSession = Depends(get_db),
) -> Response:
    client_ip = request.client.host if request and request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    result = await db.execute(
        select(FileModel).options(selectinload(FileModel.owner)).where(FileModel.file_id == file_id)
    )
    file_record = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    if is_file_expired(file_record.expires_at):
        raise HTTPException(status_code=410, detail="File has expired")

    # Access control: Must be owner OR have APPROVED access request
    if file_record.owner_id != current_user.id:
        req_result = await db.execute(
            select(AccessRequest).where(
                AccessRequest.file_id == file_record.id,
                AccessRequest.user_id == current_user.id,
            )
        )
        access_req = req_result.scalar_one_or_none()
        if not access_req or access_req.status != "APPROVED":
            unauth_audit = AuditLog(
                user_id=current_user.id,
                action=f"UNAUTHORIZED_ACCESS_ATTEMPT:file_{file_record.file_id}",
                ip_address=client_ip,
                user_agent=user_agent,
            )
            db.add(unauth_audit)
            await db.flush()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not have owner approval to download this file.",
            )

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
    except Exception:
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

    download_log = DownloadLog(
        file_id=file_record.id,
        downloaded_by=current_user.username,
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(download_log)

    download_audit = AuditLog(
        user_id=current_user.id,
        action=f"FILE_DOWNLOADED:file_{file_record.file_id}",
        ip_address=client_ip,
        user_agent=user_agent,
    )
    db.add(download_audit)
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
